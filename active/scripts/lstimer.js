


(function() {
  
  const originalSetInterval = window.setInterval;
  
  
  
  
  window.setInterval = function(callback, delay) {
    
    if (delay === 1000 || delay === 1e3 || delay === 5000 || delay === 5e3) {
      console.log("Monitoring interval blocked");
      
      return Math.floor(Math.random() * 1000000);
    }
    
    
    return originalSetInterval(callback, delay);
  };
  
  
  const maxIntervalId = 1000;
  for (let i = 1; i <= maxIntervalId; i++) {
    window.clearInterval(i);
  }
})();
