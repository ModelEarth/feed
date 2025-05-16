(function() {
    function loadScript(file) {
        var script = document.createElement('script');
        script.src = file;
        script.type = 'module';
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
    }
  
    function loadCSS(file) {
        var link = document.createElement('link');
        link.href = file;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
  
    function loadFilesIfNotInDist(jsFile, cssFile) {
        // Get the current path
        var currentPath = window.location.pathname;
  
        console.log("The current path is " + currentPath);
  
        // Check if the path does not contain "/dist/"
        if (!currentPath.includes('/dist/')) {
            // Load the JS and CSS files
            loadScript(jsFile);
            loadCSS(cssFile);
        } else {
            console.log('Current path contains /dist/, files will not be loaded.');
        }
    }
  
    // Ensure this function is called
    loadFilesIfNotInDist('/feed/dist/assets/index-61ddd40b.js', '/feed/dist/assets/index-445cb8a7.css');
    // Alternatively, use the following line for development paths
    // loadFilesIfNotInDist('/feed/src/feedplayer.js', '/feed/src/feedplayer.css');
  })();