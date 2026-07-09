

async function test() {
  try {
    console.log("1. Testing gig slug validation:");
    let res = await fetch("http://localhost:5000/api/freelancer/client/gigs/validate-slug?slug=build-a-custom-nextjs-react-full-stack-application");
    let json = await res.json();
    console.log("Is 'build-a-custom-nextjs-react-full-stack-application' available?", json);

    console.log("\n2. Testing freelancer slug validation:");
    res = await fetch("http://localhost:5000/api/freelancer/profile/validate-slug?slug=alex-rivera");
    json = await res.json();
    console.log("Is 'alex-rivera' available?", json);

    console.log("\n3. Testing fetching gig by slug:");
    res = await fetch("http://localhost:5000/api/freelancer/client/gigs/build-a-custom-nextjs-react-full-stack-application");
    json = await res.json();
    console.log("Fetched gig title:", json.title || json.message);

    console.log("\n4. Testing fetching freelancer profile by slug:");
    res = await fetch("http://localhost:5000/api/freelancer/profile/alex-rivera");
    json = await res.json();
    console.log("Fetched profile name:", json.user?.name || json.message);

  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
