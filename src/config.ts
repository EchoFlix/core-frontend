const isProd = window.location.hostname.includes("cloudfront.net") || window.location.hostname.includes("amazonaws.com");

export const API_BASE = isProd
  ? "http://ec2-34-204-7-231.compute-1.amazonaws.com:8000"
  : "http://localhost:8000";