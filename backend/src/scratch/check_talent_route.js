

async function check() {
  try {
    const res = await fetch("http://localhost:3000/talent");
    console.log("Status of /talent:", res.status);
    const html = await res.text();
    console.log("HTML length:", html.length);
    console.log("HTML snippet:", html.slice(0, 500));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

check();
