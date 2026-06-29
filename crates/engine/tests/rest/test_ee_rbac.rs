use solas_trace_engine::ee::{EnterpriseManager, LicenseTier};

#[test]
fn test_enterprise_manager_default_tier_is_community() {
    // In CI/CD where no valid license key is exported, it should gracefully
    // default to the Community tier to prevent blocking local development.
    let manager = EnterpriseManager::new();
    assert_eq!(manager.get_license_tier(), LicenseTier::Community);
}

#[test]
fn test_rbac_check_permissions_admin_override() {
    let manager = EnterpriseManager::new();
    
    // Admins should always have access to read traces
    let is_allowed = manager.check_permission("admin", "read_trace");
    assert!(is_allowed, "Admins must have read_trace permissions");
}

#[test]
fn test_rbac_check_permissions_viewer_restrictions() {
    let manager = EnterpriseManager::new();
    
    // Viewers should NOT have access to delete traces
    let is_allowed = manager.check_permission("viewer", "delete_trace");
    assert!(!is_allowed, "Viewers must not have delete_trace permissions");
}

#[test]
fn test_audit_log_formatting() {
    let manager = EnterpriseManager::new();
    
    // We just verify it executes without panicking.
    // Real implementation would inspect the structured log output.
    manager.log_audit_event("user_991", "delete_trace", "trace_001");
}
