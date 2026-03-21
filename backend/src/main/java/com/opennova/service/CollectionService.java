package com.opennova.service;

import com.opennova.model.Collection;
import com.opennova.model.Establishment;
import com.opennova.repository.CollectionRepository;
import com.opennova.repository.EstablishmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

@Service
public class CollectionService {

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private EstablishmentRepository establishmentRepository;
    
    @Autowired
    private FileStorageService fileStorageService;

    public List<Collection> getCollectionsByEstablishmentId(Long establishmentId) {
        return collectionRepository.findActiveCollectionsByEstablishmentIdOrderByCreatedAtDesc(establishmentId);
    }

    public Collection saveCollection(Collection collection) {
        try {
            collection.setCreatedAt(LocalDateTime.now());
            collection.setUpdatedAt(LocalDateTime.now());
            return collectionRepository.save(collection);
        } catch (Exception e) {
            System.err.println("Error saving collection: " + e.getMessage());
            throw new RuntimeException("Failed to save collection: " + e.getMessage());
        }
    }

    public Collection createCollection(Long establishmentId, Collection collection, MultipartFile imageFile) {
        try {
            System.out.println("🛍️ CollectionService: Creating collection for establishment ID: " + establishmentId);
            
            Optional<Establishment> establishment = establishmentRepository.findById(establishmentId);
            if (!establishment.isPresent()) {
                System.err.println("❌ Establishment not found with ID: " + establishmentId);
                throw new RuntimeException("Establishment not found with ID: " + establishmentId);
            }
            
            Establishment est = establishment.get();
            System.out.println("✅ Found establishment: " + est.getName());
            
            // Validate collection data
            if (collection.getItemName() == null || collection.getItemName().trim().isEmpty()) {
                throw new RuntimeException("Collection name is required");
            }
            if (collection.getPrice() == null || collection.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Valid collection price is required");
            }
            
            collection.setEstablishment(est);
            collection.setCreatedAt(LocalDateTime.now());
            collection.setUpdatedAt(LocalDateTime.now());
            collection.setIsActive(true);
            collection.setIsAvailable(true); // Set as available by default

            // Handle image upload
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    System.out.println("📷 Storing collection image: " + imageFile.getOriginalFilename());
                    String imagePath = fileStorageService.storeFile(imageFile, "collection-images");
                    collection.setImagePath(imagePath);
                    System.out.println("✅ Image stored at: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to store collection image: " + e.getMessage());
                    e.printStackTrace();
                    // Continue without image
                }
            } else {
                System.out.println("ℹ️ No image provided for collection");
            }
            
            System.out.println("💾 Saving collection to database...");
            Collection savedCollection = collectionRepository.save(collection);
            System.out.println("✅ Collection saved successfully with ID: " + savedCollection.getId());
            
            // Verify the collection was saved with correct active status
            if (!savedCollection.getIsActive()) {
                System.err.println("⚠️ Warning: Collection was saved but isActive is false");
            }
            
            return savedCollection;
        } catch (Exception e) {
            System.err.println("❌ Error creating collection: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create collection: " + e.getMessage());
        }
    }

    public Collection updateCollection(Long collectionId, String name, String description, 
                                     BigDecimal price, String category, String brand, 
                                     String size, String color, boolean isAvailable, 
                                     MultipartFile imageFile, Long establishmentId) {
        try {
            System.out.println("🔄 CollectionService: Updating collection ID: " + collectionId);
            
            Optional<Collection> existingCollection = collectionRepository.findById(collectionId);
            if (!existingCollection.isPresent()) {
                throw new RuntimeException("Collection not found with ID: " + collectionId);
            }
            
            Collection collection = existingCollection.get();
            
            // Verify ownership
            if (!collection.getEstablishment().getId().equals(establishmentId)) {
                throw new RuntimeException("Unauthorized to update this collection");
            }
            
            // Update fields that exist in the model
            collection.setItemName(name.trim()); // Using itemName field
            collection.setDescription(description.trim());
            collection.setPrice(price);
            collection.setBrand(brand);
            // Note: category, size, color fields don't exist in current model
            // Using sizes and colors fields instead
            if (size != null) {
                collection.setSizes(size); // Using sizes field for size
            }
            if (color != null) {
                collection.setColors(color); // Using colors field for color
            }
            collection.setIsAvailable(isAvailable);
            collection.setUpdatedAt(LocalDateTime.now());

            // Handle image upload
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    // Delete old image if exists
                    if (collection.getImagePath() != null) {
                        try {
                            fileStorageService.deleteFile(collection.getImagePath());
                        } catch (Exception e) {
                            System.err.println("⚠️ Failed to delete old image: " + e.getMessage());
                        }
                    }
                    
                    String imagePath = fileStorageService.storeFile(imageFile, "collection-images");
                    collection.setImagePath(imagePath);
                    System.out.println("✅ Updated collection image: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to update collection image: " + e.getMessage());
                    // Continue without updating image
                }
            }
            
            Collection updatedCollection = collectionRepository.save(collection);
            System.out.println("✅ Collection updated successfully: " + updatedCollection.getItemName());
            
            return updatedCollection;
        } catch (Exception e) {
            System.err.println("❌ Error updating collection: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update collection: " + e.getMessage());
        }
    }

    public void deleteCollection(Long collectionId, Long establishmentId) {
        try {
            Optional<Collection> existingCollection = collectionRepository.findById(collectionId);
            if (!existingCollection.isPresent()) {
                throw new RuntimeException("Collection not found with ID: " + collectionId);
            }
            
            Collection collection = existingCollection.get();
            
            // Verify ownership
            if (!collection.getEstablishment().getId().equals(establishmentId)) {
                throw new RuntimeException("Unauthorized to delete this collection");
            }
            
            // Delete associated image file
            if (collection.getImagePath() != null) {
                try {
                    fileStorageService.deleteFile(collection.getImagePath());
                } catch (Exception e) {
                    System.err.println("Failed to delete collection image: " + e.getMessage());
                }
            }
            
            collection.setIsActive(false);
            collection.setUpdatedAt(LocalDateTime.now());
            collectionRepository.save(collection);
            
            System.out.println("✅ Collection deleted successfully: " + collection.getItemName());
        } catch (Exception e) {
            System.err.println("❌ Error deleting collection: " + e.getMessage());
            throw new RuntimeException("Failed to delete collection: " + e.getMessage());
        }
    }

    public Collection getCollectionById(Long collectionId, Long establishmentId) {
        Optional<Collection> collection = collectionRepository.findById(collectionId);
        if (collection.isPresent() && collection.get().getEstablishment().getId().equals(establishmentId) && collection.get().getIsActive()) {
            return collection.get();
        }
        return null;
    }

    public long getCollectionCountByEstablishment(Long establishmentId) {
        return collectionRepository.countByEstablishmentIdAndIsActive(establishmentId);
    }

    public boolean collectionExistsByItemName(Long establishmentId, String itemName) {
        return collectionRepository.existsByEstablishmentIdAndItemName(establishmentId, itemName);
    }

    public Collection toggleCollectionAvailability(Long collectionId, Long establishmentId) {
        try {
            System.out.println("🔄 CollectionService: Toggling availability for collection ID: " + collectionId);
            
            Optional<Collection> existingCollection = collectionRepository.findById(collectionId);
            if (!existingCollection.isPresent()) {
                throw new RuntimeException("Collection not found with ID: " + collectionId);
            }
            
            Collection collection = existingCollection.get();
            
            // Verify ownership
            if (!collection.getEstablishment().getId().equals(establishmentId)) {
                throw new RuntimeException("Unauthorized to toggle this collection's availability");
            }
            
            // Toggle availability
            collection.setIsAvailable(!collection.getIsAvailable());
            collection.setUpdatedAt(LocalDateTime.now());
            
            Collection updatedCollection = collectionRepository.save(collection);
            System.out.println("✅ Collection availability toggled: " + collection.getItemName() + " -> " + collection.getIsAvailable());
            
            return updatedCollection;
        } catch (Exception e) {
            System.err.println("❌ Error toggling collection availability: " + e.getMessage());
            throw new RuntimeException("Failed to toggle collection availability: " + e.getMessage());
        }
    }
    
    public List<Collection> findByOwnerId(Long ownerId) {
        // Find establishments owned by this owner, then get their collections
        try {
            List<Establishment> establishments = establishmentRepository.findByOwnerId(ownerId);
            List<Collection> allCollections = new ArrayList<>();
            
            for (Establishment establishment : establishments) {
                List<Collection> collections = getCollectionsByEstablishmentId(establishment.getId());
                allCollections.addAll(collections);
            }
            
            return allCollections;
        } catch (Exception e) {
            System.err.println("Error finding collections by owner ID: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    public List<Collection> findByEstablishmentId(Long establishmentId) {
        return getCollectionsByEstablishmentId(establishmentId);
    }
    
    public Collection save(Collection collection) {
        return saveCollection(collection);
    }
}