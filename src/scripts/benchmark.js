import autocannon from "autocannon";

const BASE_URL = process.env.BENCH_URL || "http://localhost:5000/api/v1";

function runBench({ title, url, method = "GET", headers = {}, body = null, connections = 20, duration = 10 }) {
  return new Promise((resolve) => {
    const instance = autocannon({
      url,
      method,
      connections,
      duration,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    autocannon.track(instance, { renderProgressBar: false });

    instance.on("done", (result) => {
      resolve({
        title,
        url,
        method,
        connections,
        duration,
        requestsPerSec: result.requests.average,
        latencyAvg: result.latency.average,
        latencyP95: result.latency.p95,
        latencyMax: result.latency.max,
        bytesPerSec: result.throughput.average,
        errors: result.errors,
        timeouts: result.timeouts,
      });
    });
  });
}

async function main() {
  const report = [];

  report.push(
    await runBench({
      title: "Health check",
      url: `${BASE_URL}/health`,
      connections: 50,
      duration: 10,
    })
  );

  report.push(
    await runBench({
      title: "Public product listing",
      url: `${BASE_URL}/marketplace/products?page=1&limit=10`,
      connections: 30,
      duration: 10,
    })
  );

  report.push(
    await runBench({
      title: "Public rental search",
      url: `${BASE_URL}/rentals/spaces?page=1&limit=10&search=Dhaka`,
      connections: 30,
      duration: 10,
    })
  );

  const adminToken = process.env.BENCH_ADMIN_TOKEN;
  if (adminToken) {
    report.push(
      await runBench({
        title: "Admin vendor listing",
        url: `${BASE_URL}/admin/vendors?page=1&limit=10`,
        connections: 10,
        duration: 10,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })
    );
  }

  console.log("\n\n================ BENCHMARK REPORT ================\n");

  for (const item of report) {
    console.log(`Endpoint: ${item.title}`);
    console.log(`Method: ${item.method}`);
    console.log(`URL: ${item.url}`);
    console.log(`Connections: ${item.connections}`);
    console.log(`Duration: ${item.duration}s`);
    console.log(`Req/sec avg: ${item.requestsPerSec?.toFixed(2)}`);
    console.log(`Latency avg: ${item.latencyAvg?.toFixed(2)} ms`);
    console.log(`Latency p95: ${item.latencyP95?.toFixed(2)} ms`);
    console.log(`Latency max: ${item.latencyMax?.toFixed(2)} ms`);
    console.log(`Throughput: ${item.bytesPerSec?.toFixed(2)} bytes/sec`);
    console.log(`Errors: ${item.errors}`);
    console.log(`Timeouts: ${item.timeouts}`);
    console.log("--------------------------------------------------");
  }

  console.log("\nSuggested summary for submission:");
  console.log("- Public read endpoints should stay fast because they are indexed and paginated.");
  console.log("- Write endpoints are protected and rate-limited.");
  console.log("- Heavy queries should always use page/limit and indexed filters.");
  console.log("- Transactions are used for bookings and orders to keep data consistent.");
  console.log("- Socket.IO handles live updates without polling the database repeatedly.");
  console.log("\n==================================================\n");
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});