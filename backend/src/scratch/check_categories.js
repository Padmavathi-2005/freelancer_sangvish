async function check() {
  try {
    const res = await fetch("http://localhost:5000/api/categories-stats");
    console.log("Status of categories-stats:", res.status);
    const data = await res.json();
    console.log("Categories data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

check();
