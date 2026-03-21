package com.opennova.service;

import com.opennova.model.Menu;
import com.opennova.model.Establishment;
import com.opennova.repository.MenuRepository;
import com.opennova.repository.EstablishmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class MenuService {

    @Autowired
    private MenuRepository menuRepository;
    
    @Autowired
    private EstablishmentRepository establishmentRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public List<Menu> getMenusByEstablishmentId(Long establishmentId) {
        System.out.println("🔍 MenuService: Fetching menus for establishment ID: " + establishmentId);
        List<Menu> menus = menuRepository.findActiveMenusByEstablishmentIdOrderByCreatedAtDesc(establishmentId);
        System.out.println("✅ Found " + menus.size() + " active menus for establishment " + establishmentId);
        
        for (Menu menu : menus) {
            System.out.println("  - Menu: " + menu.getName() + " (ID: " + menu.getId() + ", Active: " + menu.getIsActive() + ")");
        }
        
        return menus;
    }

    public List<Menu> getMenuByEstablishmentId(Long establishmentId) {
        return getMenusByEstablishmentId(establishmentId);
    }

    public Menu saveMenu(Menu menu) {
        try {
            menu.setCreatedAt(LocalDateTime.now());
            menu.setUpdatedAt(LocalDateTime.now());
            return menuRepository.save(menu);
        } catch (Exception e) {
            System.err.println("Error saving menu: " + e.getMessage());
            throw new RuntimeException("Failed to save menu: " + e.getMessage());
        }
    }

    public Menu createMenu(Long establishmentId, String name, String description, BigDecimal price, MultipartFile image) {
        try {
            Menu menu = new Menu();
            menu.setEstablishmentId(establishmentId);
            menu.setName(name);
            menu.setDescription(description);
            menu.setPrice(price);
            menu.setIsActive(true);
            menu.setCreatedAt(LocalDateTime.now());
            menu.setUpdatedAt(LocalDateTime.now());

            if (image != null && !image.isEmpty()) {
                // Handle image upload if needed
                // String imagePath = fileStorageService.storeFile(image, "menu-images");
                // menu.setImagePath(imagePath);
            }

            return menuRepository.save(menu);
        } catch (Exception e) {
            System.err.println("Error creating menu: " + e.getMessage());
            throw new RuntimeException("Failed to create menu: " + e.getMessage());
        }
    }

    public Menu createMenu(Long establishmentId, Menu menu, MultipartFile imageFile) {
        System.out.println("🍽️ MenuService: Creating menu for establishment ID: " + establishmentId);
        
        try {
            Optional<Establishment> establishment = establishmentRepository.findById(establishmentId);
            if (!establishment.isPresent()) {
                System.err.println("❌ Establishment not found with ID: " + establishmentId);
                throw new RuntimeException("Establishment not found with ID: " + establishmentId);
            }
            
            Establishment est = establishment.get();
            System.out.println("✅ Found establishment: " + est.getName());
            
            // Validate menu data
            if (menu.getName() == null || menu.getName().trim().isEmpty()) {
                throw new RuntimeException("Menu name is required");
            }
            if (menu.getPrice() == null || menu.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Valid menu price is required");
            }
            
            menu.setEstablishment(est);
            menu.setCreatedAt(LocalDateTime.now());
            menu.setUpdatedAt(LocalDateTime.now());
            menu.setIsActive(true);

            // Handle image upload
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    System.out.println("📷 Storing menu image: " + imageFile.getOriginalFilename());
                    String imagePath = fileStorageService.storeFile(imageFile, "menu-images");
                    menu.setImagePath(imagePath);
                    System.out.println("✅ Image stored at: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to store menu image: " + e.getMessage());
                    e.printStackTrace();
                    // Continue without image
                }
            } else {
                System.out.println("ℹ️ No image provided for menu item");
            }

            System.out.println("💾 Saving menu to database...");
            Menu savedMenu = menuRepository.save(menu);
            System.out.println("✅ Menu saved successfully with ID: " + savedMenu.getId());
            
            // Verify the menu was saved with correct active status
            if (!savedMenu.getIsActive()) {
                System.err.println("⚠️ Warning: Menu was saved but isActive is false");
            }
            
            return savedMenu;
        } catch (Exception e) {
            System.err.println("❌ Error creating menu: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create menu: " + e.getMessage());
        }
    }

    public Menu updateMenu(Long menuId, Menu menuData, MultipartFile imageFile) {
        try {
            System.out.println("🔄 MenuService: Updating menu ID: " + menuId);
            
            Optional<Menu> existingMenu = menuRepository.findById(menuId);
            if (!existingMenu.isPresent()) {
                throw new RuntimeException("Menu not found with ID: " + menuId);
            }
            
            Menu menu = existingMenu.get();
            
            // Update fields only if provided
            if (menuData.getName() != null && !menuData.getName().trim().isEmpty()) {
                menu.setName(menuData.getName().trim());
            }
            if (menuData.getDescription() != null) {
                menu.setDescription(menuData.getDescription().trim());
            }
            if (menuData.getPrice() != null && menuData.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                menu.setPrice(menuData.getPrice());
            }
            if (menuData.getCategory() != null) {
                menu.setCategory(menuData.getCategory().trim());
            }
            if (menuData.getPreparationTime() != null) {
                menu.setPreparationTime(menuData.getPreparationTime());
            }
            if (menuData.getIsVegetarian() != null) {
                menu.setIsVegetarian(menuData.getIsVegetarian());
            }
            if (menuData.getIsAvailable() != null) {
                menu.setIsAvailable(menuData.getIsAvailable());
            }
            
            menu.setUpdatedAt(LocalDateTime.now());
            menu.setIsActive(true); // Ensure menu remains active after update

            // Handle image upload
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    // Delete old image if exists
                    if (menu.getImagePath() != null) {
                        try {
                            fileStorageService.deleteFile(menu.getImagePath());
                        } catch (Exception e) {
                            System.err.println("⚠️ Failed to delete old image: " + e.getMessage());
                        }
                    }
                    
                    String imagePath = fileStorageService.storeFile(imageFile, "menu-images");
                    menu.setImagePath(imagePath);
                    System.out.println("✅ Updated menu image: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to update menu image: " + e.getMessage());
                    // Continue without updating image
                }
            }

            Menu updatedMenu = menuRepository.save(menu);
            System.out.println("✅ Menu updated successfully: " + updatedMenu.getName());
            
            return updatedMenu;
        } catch (Exception e) {
            System.err.println("❌ Error updating menu: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update menu: " + e.getMessage());
        }
    }

    public boolean deleteMenu(Long menuId) {
        Optional<Menu> menu = menuRepository.findById(menuId);
        if (menu.isPresent()) {
            Menu menuItem = menu.get();
            
            // Delete associated image file
            if (menuItem.getImagePath() != null) {
                try {
                    fileStorageService.deleteFile(menuItem.getImagePath());
                } catch (Exception e) {
                    System.err.println("Failed to delete menu image: " + e.getMessage());
                }
            }
            
            menuItem.setIsActive(false);
            menuItem.setUpdatedAt(LocalDateTime.now());
            menuRepository.save(menuItem);
            return true;
        }
        return false;
    }

    public Menu getMenuById(Long menuId) {
        return menuRepository.findById(menuId).orElse(null);
    }

    public long getMenuCountByEstablishment(Long establishmentId) {
        return menuRepository.countByEstablishmentId(establishmentId);
    }

    public boolean menuExistsByName(Long establishmentId, String name) {
        return menuRepository.existsByEstablishmentIdAndName(establishmentId, name);
    }

    public Menu updateMenu(Long menuId, String name, String description, BigDecimal price, 
                          String category, String availabilityTime, int preparationTime, 
                          boolean isVegetarian, boolean isAvailable, boolean isSpecial, 
                          MultipartFile imageFile, Long establishmentId) {
        try {
            System.out.println("🔄 MenuService: Updating menu ID: " + menuId);
            
            Optional<Menu> existingMenu = menuRepository.findById(menuId);
            if (!existingMenu.isPresent()) {
                throw new RuntimeException("Menu not found with ID: " + menuId);
            }
            
            Menu menu = existingMenu.get();
            
            // Verify ownership
            if (!menu.getEstablishment().getId().equals(establishmentId)) {
                throw new RuntimeException("Unauthorized to modify this menu");
            }
            
            // Update fields
            menu.setName(name.trim());
            menu.setDescription(description.trim());
            menu.setPrice(price);
            menu.setCategory(category.trim());
            menu.setAvailabilityTime(availabilityTime);
            menu.setPreparationTime(preparationTime);
            menu.setIsVegetarian(isVegetarian);
            menu.setIsAvailable(isAvailable);
            menu.setIsSpecial(isSpecial);
            menu.setUpdatedAt(LocalDateTime.now());

            // Handle image upload
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    // Delete old image if exists
                    if (menu.getImagePath() != null) {
                        try {
                            fileStorageService.deleteFile(menu.getImagePath());
                        } catch (Exception e) {
                            System.err.println("⚠️ Failed to delete old image: " + e.getMessage());
                        }
                    }
                    
                    String imagePath = fileStorageService.storeFile(imageFile, "menu-images");
                    menu.setImagePath(imagePath);
                    System.out.println("✅ Updated menu image: " + imagePath);
                } catch (Exception e) {
                    System.err.println("❌ Failed to update menu image: " + e.getMessage());
                    // Continue without updating image
                }
            }

            Menu updatedMenu = menuRepository.save(menu);
            System.out.println("✅ Menu updated successfully: " + updatedMenu.getName());
            
            return updatedMenu;
        } catch (Exception e) {
            System.err.println("❌ Error updating menu: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update menu: " + e.getMessage());
        }
    }

    public void deleteMenu(Long menuId, Long establishmentId) {
        try {
            Optional<Menu> existingMenu = menuRepository.findById(menuId);
            if (!existingMenu.isPresent()) {
                throw new RuntimeException("Menu not found with ID: " + menuId);
            }
            
            Menu menu = existingMenu.get();
            
            // Verify ownership
            if (!menu.getEstablishment().getId().equals(establishmentId)) {
                throw new RuntimeException("Unauthorized to delete this menu");
            }
            
            // Delete associated image file
            if (menu.getImagePath() != null) {
                try {
                    fileStorageService.deleteFile(menu.getImagePath());
                } catch (Exception e) {
                    System.err.println("Failed to delete menu image: " + e.getMessage());
                }
            }
            
            menu.setIsActive(false);
            menu.setUpdatedAt(LocalDateTime.now());
            menuRepository.save(menu);
            
            System.out.println("✅ Menu deleted successfully: " + menu.getName());
        } catch (Exception e) {
            System.err.println("❌ Error deleting menu: " + e.getMessage());
            throw new RuntimeException("Failed to delete menu: " + e.getMessage());
        }
    }

    public Menu toggleAvailability(Long menuId, Long establishmentId) {
        try {
            Optional<Menu> existingMenu = menuRepository.findById(menuId);
            if (!existingMenu.isPresent()) {
                throw new RuntimeException("Menu not found");
            }
            
            Menu menu = existingMenu.get();
            
            // Verify ownership
            if (!menu.getEstablishment().getId().equals(establishmentId)) {
                throw new RuntimeException("Unauthorized to modify this menu");
            }
            
            // Toggle availability
            menu.setIsAvailable(!menu.getIsAvailable());
            menu.setUpdatedAt(LocalDateTime.now());
            
            Menu updatedMenu = menuRepository.save(menu);
            System.out.println("✅ Menu availability toggled: " + menu.getName() + " -> " + menu.getIsAvailable());
            
            return updatedMenu;
        } catch (Exception e) {
            System.err.println("❌ Error toggling menu availability: " + e.getMessage());
            throw new RuntimeException("Failed to toggle menu availability: " + e.getMessage());
        }
    }

    public Menu toggleMenuAvailability(Long menuId, Long establishmentId) {
        return toggleAvailability(menuId, establishmentId);
    }
    public List<Menu> findByEstablishmentId(Long establishmentId) {
        return getMenusByEstablishmentId(establishmentId);
    }

    public Optional<Menu> findById(Long id) {
        return menuRepository.findById(id);
    }

    public Menu save(Menu menu) {
        return saveMenu(menu);
    }

    public void deleteById(Long id) {
        deleteMenu(id);
    }
}