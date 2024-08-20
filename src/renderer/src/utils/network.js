export const getHostname = () => {
    let localhostname = "localhost";
    if (window.location.hostname && !window.location.hostname.includes("file") && window.location.hostname.length > 0) {
      localhostname = window.location.hostname;
    }
    return localhostname;
  };
  
  export const getPort = async () => {
    if (window.location.protocol === "file:") {
      return 3333; // Usar el puerto por defecto si es `file://`
    }
  
    const windowPort = window.location.port;
    const defaultPort = windowPort - 1;
    return defaultPort === 5173 || defaultPort === 5172 || !defaultPort
      ? await fetchPort(3333)
      : await fetchPort(windowPort);
  };
  
  const fetchPort = async (portfetch) => {
    const protocol = window.location.protocol;
    const existip = portfetch ? portfetch : 3333;
    const localhostname = getHostname();
    console.log("protocol", protocol, "existip", existip, "localhostname", localhostname);
    try {
    //   const response = await fetch(
    //     `${protocol}://${localhostname}:${existip}/port`
    //   );
    //   const contentType = response.headers.get("content-type");
    //   if (!contentType || !contentType.includes("application/json")) {
    //     throw new TypeError("La respuesta no es JSON válido");
    //   }
    //   const data = await response.json();
    //   console.log("Socket.IO server port:", data.port);
    //   return data.port;
    console.log("fetchPort", protocol, localhostname, existip);
    return existip;
    } catch (error) {
      console.error("Error fetching port:", error);
      return portfetch;
    }
  };
  