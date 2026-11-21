package in.floodresponse.gateway.web;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * HTTP client the gateway uses to call the services. Forced to HTTP/1.1: the default
 * HTTP/2 upgrade attempt makes the Python (uvicorn) service drop the connection.
 */
@Configuration
class ProxyClientConfig {

    @Bean
    ClientHttpRequestFactory gatewayProxyRequestFactory() {
        HttpClient client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
        factory.setReadTimeout(Duration.ofSeconds(60));
        return factory;
    }
}
