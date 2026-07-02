import axios from "axios";

export async function POST(request) {
  try {
    const { event } = await request.json();
    const zohoWebhookUrl = process.env.ZOHO_WEBHOOK_URL;

    if (!zohoWebhookUrl) {
      console.error("ZOHO_WEBHOOK_URL environment variable is not configured");
      return new Response(JSON.stringify({ error: "Failed to send to Zoho" }), {
        status: 500,
      });
    }

    await axios.post(
      zohoWebhookUrl,
      { event },
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error sending to Zoho:", error);
    return new Response(JSON.stringify({ error: "Failed to send to Zoho" }), {
      status: 500,
    });
  }
}
