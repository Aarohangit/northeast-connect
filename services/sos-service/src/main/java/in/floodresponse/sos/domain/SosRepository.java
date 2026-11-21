package in.floodresponse.sos.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SosRepository extends JpaRepository<SosRequest, Long> {

    Optional<SosRequest> findByClientRequestId(String clientRequestId);

    Optional<SosRequest> findByReference(String reference);

    boolean existsByReference(String reference);

    @Query("""
            select s from SosRequest s
            where (:status is null or s.status = :status)
              and (:district is null or s.district = :district)
            order by s.receivedAt desc
            """)
    List<SosRequest> search(RescueStatus status, String district);

    /**
     * Recent reports in a rough bounding box, as duplicate candidates. Reports already
     * closed as duplicate or rejected are skipped so we always point at the original.
     */
    @Query("""
            select s from SosRequest s
            where s.id <> :excludeId and s.receivedAt > :since
              and s.status not in (in.floodresponse.sos.domain.RescueStatus.DUPLICATE,
                                   in.floodresponse.sos.domain.RescueStatus.REJECTED)
              and s.latitude between :minLat and :maxLat
              and s.longitude between :minLng and :maxLng
            """)
    List<SosRequest> nearbySince(Long excludeId, java.time.Instant since,
                                 double minLat, double maxLat, double minLng, double maxLng);
}
