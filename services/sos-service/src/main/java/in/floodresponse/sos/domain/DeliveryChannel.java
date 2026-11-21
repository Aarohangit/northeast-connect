package in.floodresponse.sos.domain;

/** How the request reached us. QUEUED_SYNC means it sat on the device first. */
public enum DeliveryChannel {
    DIRECT,
    QUEUED_SYNC,
    SMS
}
