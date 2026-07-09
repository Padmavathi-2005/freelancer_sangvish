async function check() {
  try {
    const res = await fetch("http://localhost:3000/talent?category=Programming%20%26%20Tech");
    console.log("Status of /talent?category=Programming & Tech:", res.status);
    const html = await res.text();
    console.log("HTML length:", html.length);
    console.log("HTML snippet:", html.slice(0, 500));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

check();
