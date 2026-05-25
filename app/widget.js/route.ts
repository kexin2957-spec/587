export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const script = `
(function () {
  var currentScript = document.currentScript;
  var agentId = currentScript && currentScript.getAttribute("data-agent-id");
  if (!agentId) return;
  var orderNumber = currentScript.getAttribute("data-order-number") || "";
  var licenseKey = currentScript.getAttribute("data-license-key") || "";
  var position = currentScript.getAttribute("data-position") || "bottom_right";
  var iframe = document.createElement("iframe");
  var queryParts = [];
  if (orderNumber) queryParts.push("order=" + encodeURIComponent(orderNumber));
  if (licenseKey) queryParts.push("license=" + encodeURIComponent(licenseKey));
  if (window.location && window.location.hostname) {
    queryParts.push("parent_domain=" + encodeURIComponent(window.location.hostname));
  }
  var query = queryParts.length ? "?" + queryParts.join("&") : "";
  iframe.src = "${origin}/embed/agents/" + encodeURIComponent(agentId) + query;
  iframe.title = "AI Agent Chat Widget";
  iframe.loading = "lazy";
  iframe.allow = "clipboard-write";
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style[position === "bottom_left" ? "left" : "right"] = "20px";
  iframe.style.width = "min(420px, calc(100vw - 32px))";
  iframe.style.height = "min(680px, calc(100vh - 32px))";
  iframe.style.border = "0";
  iframe.style.borderRadius = "20px";
  iframe.style.zIndex = "2147483647";
  iframe.style.background = "transparent";
  iframe.style.boxShadow = "0 24px 80px rgba(15, 23, 42, 0.22)";
  document.body.appendChild(iframe);
})();`;

  return new Response(script, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/javascript; charset=utf-8",
    },
  });
}
