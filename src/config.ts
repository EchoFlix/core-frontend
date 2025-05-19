const environment = import.meta.env.VITE_ENVIRONMENT || "preview"
let API_BASE = ""
if (environment === "preview")
    API_BASE = "http://ec2-34-204-7-231.compute-1.amazonaws.com:8000";
else
    API_BASE = "http://localhost:8000";

export { API_BASE };