package com.opennova.repository;

import com.opennova.model.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {
    
    @Query("SELECT m FROM Menu m WHERE m.establishment.id = :establishmentId")
    List<Menu> findByEstablishmentId(@Param("establishmentId") Long establishmentId);
    
    @Query("SELECT m FROM Menu m WHERE m.establishment.id = :establishmentId ORDER BY m.createdAt DESC")
    List<Menu> findByEstablishmentIdOrderByCreatedAtDesc(@Param("establishmentId") Long establishmentId);
    
    @Query("SELECT m FROM Menu m WHERE m.establishment.id = :establishmentId AND m.isActive = true")
    List<Menu> findActiveMenusByEstablishmentId(@Param("establishmentId") Long establishmentId);
    
    @Query("SELECT m FROM Menu m WHERE m.establishment.id = :establishmentId AND m.isActive = true ORDER BY m.createdAt DESC")
    List<Menu> findActiveMenusByEstablishmentIdOrderByCreatedAtDesc(@Param("establishmentId") Long establishmentId);
    
    @Query("SELECT COUNT(m) FROM Menu m WHERE m.establishment.id = :establishmentId")
    long countByEstablishmentId(@Param("establishmentId") Long establishmentId);
    
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Menu m WHERE m.establishment.id = :establishmentId AND m.name = :name")
    boolean existsByEstablishmentIdAndName(@Param("establishmentId") Long establishmentId, @Param("name") String name);
}