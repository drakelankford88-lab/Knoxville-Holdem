// Tutorial Bubble - Floating speech bubble component for tutorial guidance
(() => {
  let bubbleElement = null;
  let highlightElement = null;
  let currentTarget = null;

  function createBubble() {
    if (bubbleElement) return bubbleElement;
    
    bubbleElement = document.createElement('div');
    bubbleElement.className = 'tutorial-bubble hidden';
    bubbleElement.innerHTML = `
      <div class="tutorial-bubble-content">
        <span class="tutorial-bubble-text"></span>
        <button class="tutorial-next-button hidden">Next</button>
      </div>
      <div class="tutorial-bubble-arrow"></div>
    `;
    document.body.appendChild(bubbleElement);
    
    // Add click handler for Next button
    const nextButton = bubbleElement.querySelector('.tutorial-next-button');
    if (nextButton) {
      nextButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.TutorialMode) {
          window.TutorialMode.handleEvent('target-clicked');
        }
      });
    }
    
    // Create highlight overlay element
    highlightElement = document.createElement('div');
    highlightElement.className = 'tutorial-highlight hidden';
    document.body.appendChild(highlightElement);
    
    return bubbleElement;
  }

  function positionBubble(targetElement, position = 'top') {
    if (!bubbleElement || !targetElement) return;
    
    const targetRect = targetElement.getBoundingClientRect();
    const bubbleRect = bubbleElement.getBoundingClientRect();
    const arrow = bubbleElement.querySelector('.tutorial-bubble-arrow');
    
    // Reset arrow classes
    arrow.className = 'tutorial-bubble-arrow';
    
    let top, left;
    const padding = 12;
    const arrowSize = 10;
    
    // Calculate position based on where there's more space
    const spaceAbove = targetRect.top;
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceLeft = targetRect.left;
    const spaceRight = window.innerWidth - targetRect.right;
    
    // Determine best position
    if (position === 'auto') {
      if (spaceAbove > spaceBelow && spaceAbove > 150) {
        position = 'top';
      } else if (spaceBelow > 150) {
        position = 'bottom';
      } else if (spaceLeft > spaceRight) {
        position = 'left';
      } else {
        position = 'right';
      }
    }
    
    switch (position) {
      case 'top':
        top = targetRect.top - bubbleRect.height - arrowSize - padding;
        left = targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2);
        arrow.classList.add('arrow-bottom');
        break;
      case 'bottom':
        top = targetRect.bottom + arrowSize + padding;
        left = targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2);
        arrow.classList.add('arrow-top');
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (bubbleRect.height / 2);
        left = targetRect.left - bubbleRect.width - arrowSize - padding;
        arrow.classList.add('arrow-right');
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (bubbleRect.height / 2);
        left = targetRect.right + arrowSize + padding;
        arrow.classList.add('arrow-left');
        break;
    }
    
    // Keep bubble on screen
    const margin = 10;
    if (left < margin) left = margin;
    if (left + bubbleRect.width > window.innerWidth - margin) {
      left = window.innerWidth - bubbleRect.width - margin;
    }
    if (top < margin) top = margin;
    if (top + bubbleRect.height > window.innerHeight - margin) {
      top = window.innerHeight - bubbleRect.height - margin;
    }
    
    bubbleElement.style.top = `${top}px`;
    bubbleElement.style.left = `${left}px`;
  }

  function positionHighlight(targetElement) {
    if (!highlightElement || !targetElement) return;
    
    const rect = targetElement.getBoundingClientRect();
    const padding = 4;
    
    highlightElement.style.top = `${rect.top - padding}px`;
    highlightElement.style.left = `${rect.left - padding}px`;
    highlightElement.style.width = `${rect.width + padding * 2}px`;
    highlightElement.style.height = `${rect.height + padding * 2}px`;
  }

  function show(targetElement, message, options = {}) {
    createBubble();
    
    const { position = 'auto', highlight = true, showNextButton = false } = options;
    
    // Set message
    const textEl = bubbleElement.querySelector('.tutorial-bubble-text');
    textEl.textContent = message;
    
    // Show/hide Next button
    const nextButton = bubbleElement.querySelector('.tutorial-next-button');
    if (nextButton) {
      if (showNextButton) {
        nextButton.classList.remove('hidden');
      } else {
        nextButton.classList.add('hidden');
      }
    }
    
    // Show bubble
    bubbleElement.classList.remove('hidden');
    
    // Store current target
    currentTarget = targetElement;
    
    // Position after a frame to get correct dimensions
    requestAnimationFrame(() => {
      positionBubble(targetElement, position);
      
      if (highlight && targetElement) {
        positionHighlight(targetElement);
        highlightElement.classList.remove('hidden');
        targetElement.classList.add('tutorial-target');
      }
    });
  }

  function hide() {
    if (bubbleElement) {
      bubbleElement.classList.add('hidden');
    }
    if (highlightElement) {
      highlightElement.classList.add('hidden');
    }
    if (currentTarget) {
      currentTarget.classList.remove('tutorial-target');
      currentTarget = null;
    }
  }

  function updatePosition() {
    if (currentTarget && bubbleElement && !bubbleElement.classList.contains('hidden')) {
      positionBubble(currentTarget, 'auto');
      positionHighlight(currentTarget);
    }
  }

  // Reposition on window resize
  window.addEventListener('resize', updatePosition);

  window.TutorialBubble = {
    show,
    hide,
    updatePosition,
    getCurrentTarget: () => currentTarget,
  };
})();

