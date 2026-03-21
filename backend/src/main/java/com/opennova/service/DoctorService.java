package com.opennova.service;

import com.opennova.model.Doctor;
import com.opennova.model.Establishment;
import com.opennova.repository.DoctorRepository;
import com.opennova.repository.EstablishmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;
    
    @Autowired
    private EstablishmentRepository establishmentRepository;
    
    @Autowired
    private FileStorageService fileStorageService;

    public List<Doctor> getDoctorsByEstablishmentId(Long establishmentId) {
        return doctorRepository.findActiveDoctorsByEstablishmentIdOrderByCreatedAtDesc(establishmentId);
    }

    public Doctor saveDoctor(Doctor doctor) {
        try {
            doctor.setCreatedAt(LocalDateTime.now());
            doctor.setUpdatedAt(LocalDateTime.now());
            return doctorRepository.save(doctor);
        } catch (Exception e) {
            System.err.println("Error saving doctor: " + e.getMessage());
            throw new RuntimeException("Failed to save doctor: " + e.getMessage());
        }
    }

    public Doctor createDoctor(Long establishmentId, Doctor doctor, MultipartFile imageFile) {
        try {
            System.out.println("👨‍⚕️ DoctorService: Creating doctor for establishment ID: " + establishmentId);
            
            Optional<Establishment> establishment = establishmentRepository.findById(establishmentId);
            if (!establishment.isPresent()) {
                System.err.println("❌ Establishment not found with ID: " + establishmentId);
                throw new RuntimeException("Establishment not found with ID: " + establishmentId);
            }
            
            Establishment est = establishment.get();
            System.out.println("✅ Found establishment: " + est.getName());
            
            // Validate doctor data
            if (doctor.getName() == null || doctor.getName().trim().isEmpty()) {
                throw new RuntimeException("Doctor name is required");
            }
            if (doctor.getSpecialization() == null || doctor.getSpecialization().trim().isEmpty()) {
                throw new RuntimeException("Doctor specialization is required");
            }
            
            doctor.setEstablishment(est);
            doctor.setCreatedAt(LocalDateTime.now());
            doctor.setUpdatedAt(LocalDateTime.now());
            doctor.setIsActive(true);
            doctor.setIsAvailable(true); // Set as available by default

            // Handle image upload
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    System.out.println("📷 Storing doctor image: " + imageFile.getOriginalFilename());
                    String imagePath = fileStorageService.storeFile(imageFile, "doctor-images");
                    doctor.setImagePath(imagePath);
                    System.out.println("✅ Image stored at: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to store doctor image: " + e.getMessage());
                    e.printStackTrace();
                    // Continue without image
                }
            } else {
                System.out.println("ℹ️ No image provided for doctor");
            }
            
            System.out.println("💾 Saving doctor to database...");
            Doctor savedDoctor = doctorRepository.save(doctor);
            System.out.println("✅ Doctor saved successfully with ID: " + savedDoctor.getId());
            
            // Verify the doctor was saved with correct active status
            if (!savedDoctor.getIsActive()) {
                System.err.println("⚠️ Warning: Doctor was saved but isActive is false");
            }
            
            return savedDoctor;
        } catch (Exception e) {
            System.err.println("❌ Error creating doctor: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create doctor: " + e.getMessage());
        }
    }

    public Doctor updateDoctor(Long doctorId, String name, String specialization, 
                              String qualification, String experience, BigDecimal consultationFee, 
                              String availableTime, String contactNumber, MultipartFile imageFile, 
                              Long establishmentId) {
        try {
            System.out.println("🔄 DoctorService: Updating doctor ID: " + doctorId);
            
            Optional<Doctor> existingDoctor = doctorRepository.findById(doctorId);
            if (!existingDoctor.isPresent()) {
                throw new RuntimeException("Doctor not found with ID: " + doctorId);
            }
            
            Doctor doctor = existingDoctor.get();
            
            // Verify ownership
            if (!doctor.getEstablishment().getId().equals(establishmentId)) {
                throw new RuntimeException("Unauthorized to update this doctor");
            }
            
            // Update fields that exist in the model
            doctor.setName(name.trim());
            doctor.setSpecialization(specialization.trim());
            if (consultationFee != null) {
                doctor.setPrice(consultationFee); // Using price field for consultation fee
            }
            if (availableTime != null) {
                doctor.setAvailabilityTime(availableTime); // Using availabilityTime field
            }
            // Note: qualification, experience, contactNumber fields don't exist in current model
            doctor.setUpdatedAt(LocalDateTime.now());

            // Handle image upload
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    // Delete old image if exists
                    if (doctor.getImagePath() != null) {
                        try {
                            fileStorageService.deleteFile(doctor.getImagePath());
                        } catch (Exception e) {
                            System.err.println("⚠️ Failed to delete old image: " + e.getMessage());
                        }
                    }
                    
                    String imagePath = fileStorageService.storeFile(imageFile, "doctor-images");
                    doctor.setImagePath(imagePath);
                    System.out.println("✅ Updated doctor image: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to update doctor image: " + e.getMessage());
                    // Continue without updating image
                }
            }
            
            Doctor updatedDoctor = doctorRepository.save(doctor);
            System.out.println("✅ Doctor updated successfully: " + updatedDoctor.getName());
            
            return updatedDoctor;
        } catch (Exception e) {
            System.err.println("❌ Error updating doctor: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update doctor: " + e.getMessage());
        }
    }

    public void deleteDoctor(Long doctorId, Long establishmentId) {
        try {
            Optional<Doctor> existingDoctor = doctorRepository.findById(doctorId);
            if (!existingDoctor.isPresent()) {
                throw new RuntimeException("Doctor not found with ID: " + doctorId);
            }
            
            Doctor doctor = existingDoctor.get();
            
            // Verify ownership
            if (!doctor.getEstablishment().getId().equals(establishmentId)) {
                throw new RuntimeException("Unauthorized to delete this doctor");
            }
            
            // Delete associated image file
            if (doctor.getImagePath() != null) {
                try {
                    fileStorageService.deleteFile(doctor.getImagePath());
                } catch (Exception e) {
                    System.err.println("Failed to delete doctor image: " + e.getMessage());
                }
            }
            
            // Soft delete - set isActive to false
            doctor.setIsActive(false);
            doctor.setUpdatedAt(LocalDateTime.now());
            doctorRepository.save(doctor);
            
            System.out.println("✅ Doctor deleted successfully: " + doctor.getName());
        } catch (Exception e) {
            System.err.println("❌ Error deleting doctor: " + e.getMessage());
            throw new RuntimeException("Failed to delete doctor: " + e.getMessage());
        }
    }

    public Doctor getDoctorById(Long doctorId) {
        return doctorRepository.findById(doctorId).orElse(null);
    }

    public long getDoctorCountByEstablishment(Long establishmentId) {
        return doctorRepository.countByEstablishmentIdAndIsActive(establishmentId);
    }

    public boolean doctorExistsByName(Long establishmentId, String name) {
        return doctorRepository.existsByEstablishmentIdAndName(establishmentId, name);
    }

    public Doctor toggleDoctorAvailability(Long doctorId, Long establishmentId) {
        try {
            System.out.println("🔄 DoctorService: Toggling availability for doctor ID: " + doctorId);
            
            Optional<Doctor> existingDoctor = doctorRepository.findById(doctorId);
            if (!existingDoctor.isPresent()) {
                throw new RuntimeException("Doctor not found with ID: " + doctorId);
            }
            
            Doctor doctor = existingDoctor.get();
            
            // Verify ownership
            if (!doctor.getEstablishment().getId().equals(establishmentId)) {
                throw new RuntimeException("Unauthorized to toggle this doctor's availability");
            }
            
            // Toggle availability
            doctor.setIsAvailable(!doctor.getIsAvailable());
            doctor.setUpdatedAt(LocalDateTime.now());
            
            Doctor updatedDoctor = doctorRepository.save(doctor);
            System.out.println("✅ Doctor availability toggled: " + doctor.getName() + " -> " + doctor.getIsAvailable());
            
            return updatedDoctor;
        } catch (Exception e) {
            System.err.println("❌ Error toggling doctor availability: " + e.getMessage());
            throw new RuntimeException("Failed to toggle doctor availability: " + e.getMessage());
        }
    }
    
    public List<Doctor> findByEstablishmentId(Long establishmentId) {
        return getDoctorsByEstablishmentId(establishmentId);
    }
    
    public Doctor save(Doctor doctor) {
        return saveDoctor(doctor);
    }
}