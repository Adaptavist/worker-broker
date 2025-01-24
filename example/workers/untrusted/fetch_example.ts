const response = await fetch("https://example.com");
console.log("THIS:", response.status, response.statusText);

throw response;
