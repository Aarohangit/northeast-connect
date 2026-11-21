package in.floodresponse.sos.service;

import in.floodresponse.sos.api.ChangeStatusRequest;
import in.floodresponse.sos.api.SubmitSosRequest;
import in.floodresponse.sos.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Business rules of SOS intake, without a database. */
class SosServiceTest {

    private SosRepository requests;
    private StatusChangeRepository history;
    private ApplicationEventPublisher events;
    private SosService service;

    @BeforeEach
    void setUp() {
        requests = mock(SosRepository.class);
        history = mock(StatusChangeRepository.class);
        events = mock(ApplicationEventPublisher.class);
        service = new SosService(requests, history, new ReferenceGenerator(), events);
        when(requests.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static SubmitSosRequest request(String clientId) {
        return new SubmitSosRequest(clientId, "Bina Kalita", "9864012345", EmergencyCategory.LANDSLIDE,
                "Landslide, father trapped", 3, 23.73, 92.72, 15.0, "Aizawl", "en", DeliveryChannel.QUEUED_SYNC, null);
    }

    @Test
    void newRequestIsSavedRecordedAndAnnouncedForTriage() {
        when(requests.findByClientRequestId("c-1")).thenReturn(Optional.empty());

        var result = service.submit(request("c-1"));

        assertThat(result.created()).isTrue();
        assertThat(result.request().getReference()).matches("AS-[2-9A-HJ-NP-Z]{5}");
        assertThat(result.request().getStatus()).isEqualTo(RescueStatus.RECEIVED);
        assertThat(result.request().getChannel()).isEqualTo(DeliveryChannel.QUEUED_SYNC);
        verify(history).save(any(StatusChange.class));
        verify(events).publishEvent(any(SosSubmitted.class));
    }

    @Test
    void retryFromAFlakyNetworkReturnsTheOriginalInsteadOfADuplicate() {
        SosRequest original = new SosRequest();
        original.setReference("AS-ABCDE");
        when(requests.findByClientRequestId("c-1")).thenReturn(Optional.of(original));

        var result = service.submit(request("c-1"));

        assertThat(result.created()).isFalse();
        assertThat(result.request()).isSameAs(original);
        verify(requests, never()).saveAndFlush(any());
        verify(events, never()).publishEvent(any());
    }

    @Test
    void workflowAllowsVerifyThenDispatch() {
        SosRequest s = existing(RescueStatus.RECEIVED);
        service.changeStatus("AS-ABCDE", new ChangeStatusRequest(RescueStatus.VERIFIED, "Called back", "officer"));
        assertThat(s.getStatus()).isEqualTo(RescueStatus.VERIFIED);
        service.changeStatus("AS-ABCDE", new ChangeStatusRequest(RescueStatus.TEAM_ASSIGNED, null, "officer"));
        assertThat(s.getStatus()).isEqualTo(RescueStatus.TEAM_ASSIGNED);
        verify(history, times(2)).save(any(StatusChange.class));
    }

    @Test
    void cannotSkipVerificationAndMarkRescued() {
        existing(RescueStatus.RECEIVED);
        assertThatThrownBy(() -> service.changeStatus("AS-ABCDE", new ChangeStatusRequest(RescueStatus.RESCUED, null, "x")))
                .isInstanceOf(InvalidTransitionException.class);
    }

    @Test
    void closedRequestsCannotBeReopened() {
        existing(RescueStatus.RESCUED);
        assertThatThrownBy(() -> service.changeStatus("AS-ABCDE", new ChangeStatusRequest(RescueStatus.VERIFIED, null, "x")))
                .isInstanceOf(InvalidTransitionException.class);
    }

    @Test
    void unknownReferenceIsReportedClearly() {
        when(requests.findByReference("AS-ZZZZZ")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.get("AS-ZZZZZ")).isInstanceOf(SosNotFoundException.class);
    }

    private SosRequest existing(RescueStatus status) {
        SosRequest s = new SosRequest();
        s.setReference("AS-ABCDE");
        s.setStatus(status);
        when(requests.findByReference("AS-ABCDE")).thenReturn(Optional.of(s));
        return s;
    }
}
