package in.floodresponse.sos.service;

/** Published once per new request, after the row is committed. */
public record SosSubmitted(Long sosId) {
}
