export let API_KEY: string;
export let API_SERVER: string;

if (window.location.hostname === "localhost") {
  API_KEY =
    "MEUCIQCIzIDpRwBJgU0fjTh6FZhpIrLz/WNTLIZwK2Ifx7HjtQIgfYYOPFy7ypU+KYeYzkCa9OWwbwPIt9Hk0cV8Q6pcXog=";
  API_SERVER = "http://localhost:8001";
} else {
  API_KEY =
    "MEQCIC7ADPLI3VPDNpQPaXAeB8gUk2LrvZDJIdEg9C12dj5PAiB61Te/sen1D++EJAcgnGLH4iq7HTZHv/FNByuvu4PrrA==";
  API_SERVER = "https://centeridentity.com";
}
