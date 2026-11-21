package in.floodresponse.sos.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StatusChangeRepository extends JpaRepository<StatusChange, Long> {

    List<StatusChange> findBySosOrderByChangedAtAsc(SosRequest sos);
}
