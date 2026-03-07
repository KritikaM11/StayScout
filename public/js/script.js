// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

// Auto-dismiss floating flash messages after 4 seconds
document.addEventListener("DOMContentLoaded", function() {
    // Find all alerts on the page
    const alerts = document.querySelectorAll('.alert');
    
    alerts.forEach(alert => {
        // Set a timer for 4000 milliseconds (4 seconds)
        setTimeout(() => {
            // Use Bootstrap's built-in alert closing API for a smooth fade out
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 4000);
    });
});