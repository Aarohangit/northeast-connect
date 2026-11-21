package in.floodresponse.rescue.domain;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    @EntityGraph(attributePaths = "team")
    List<Assignment> findBySosReferenceOrderByAssignedAtDesc(String sosReference);

    @EntityGraph(attributePaths = "team")
    List<Assignment> findByStatusInOrderByAssignedAtDesc(Collection<AssignmentStatus> statuses);

    @EntityGraph(attributePaths = "team")
    List<Assignment> findByTeamIdOrderByAssignedAtDesc(Long teamId);

    @EntityGraph(attributePaths = "team")
    List<Assignment> findAllByOrderByAssignedAtDesc();

    boolean existsBySosReferenceAndStatusIn(String sosReference, Collection<AssignmentStatus> statuses);
}
