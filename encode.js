const data = {
  button_text: { button_text: "Add to cart" },
  image: { image_url: "verceltshirtgroup" },
  headline: { headline: "100% cotton premium Vercel-branded t-shirt" },
};

function urlFriendlyData() {
  console.time("encode");
  let urlFriendlyData = "";

  for (const key in data) {
    const innerKey = Object.keys(data[key])[0];
    const innerValue = data[key][innerKey];
    const encodedValue = encodeURIComponent(innerValue);
    urlFriendlyData += `${key}/${innerKey}/${encodedValue}/`;
  }

  // Removing the trailing slash
  urlFriendlyData = urlFriendlyData.slice(0, -1);
  console.timeEnd("encode");
  return urlFriendlyData;
}

function decodeUrlFriendlyData(urlFriendlyData) {
  console.time("decode");
  const data = {};
  const segments = urlFriendlyData.split("/");

  for (let i = 0; i < segments.length; i += 3) {
    const key = segments[i];
    const innerKey = segments[i + 1];
    const encodedValue = segments[i + 2];

    if (!key || !innerKey || !encodedValue) {
      throw new Error("Invalid URL-friendly data string");
    }

    const innerValue = decodeURIComponent(encodedValue);
    data[key] = { [innerKey]: innerValue };
  }

  console.timeEnd("decode");
  return data;
}

console.log(decodeUrlFriendlyData(urlFriendlyData(data)));

