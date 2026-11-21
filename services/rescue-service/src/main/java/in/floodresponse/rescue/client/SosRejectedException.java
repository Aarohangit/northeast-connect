package in.floodresponse.rescue.client;

/** sos-service answered, but said no (unknown reference, illegal status change...). */
public class SosRejectedException extends RuntimeException {

    private final int status;

    public SosRejectedException(int status, String detail) {
        super(detail);
        this.status = status;
    }

    public int status() {
        return status;
    }
}
