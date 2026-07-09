async function run() {
  try {
    const res = await fetch("http://localhost:5000/api/freelancer/profile/7");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", data);
  } catch (e) {
    console.error(e);
  }
}

run();
