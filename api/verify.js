export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }

  const num = String(req.query.num || '').trim();

  if (!num) {
    return res.status(400).json({
      success: false,
      message: 'Phone number missing'
    });
  }

  if (!/^\+?[0-9]{8,15}$/.test(num)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }

  try {
    const endpoint = `https://darktoolshub.net/sms/call.php?num=${encodeURIComponent(num)}`;
    const apiResponse = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      signal: AbortSignal.timeout(12000)
    });

    const responseText = await apiResponse.text();
    let parsedData = responseText;

    try {
      parsedData = JSON.parse(responseText);
    } catch (_) {
      parsedData = responseText.slice(0, 400);
    }

    if (apiResponse.ok) {
      return res.status(200).json({
        success: true,
        message: 'Request Send',
        number: num,
        upstream_status: apiResponse.status,
        upstream_data: parsedData
      });
    }

    return res.status(200).json({
      success: false,
      message: `API Error (HTTP ${apiResponse.status})`,
      number: num,
      upstream_status: apiResponse.status,
      upstream_data: parsedData
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: `Server Error: ${error.message}`,
      number: num
    });
  }
}
