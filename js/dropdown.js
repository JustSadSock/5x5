(function(){
  function init(dropdown, initial){
    const display = dropdown.querySelector('.dropdown-display');
    const list = dropdown.querySelector('.dropdown-list');
    const options = Array.from(dropdown.querySelectorAll('.dropdown-option'));
    const set = (val,text)=>{
      dropdown.dataset.value = val;
      if(display) display.textContent = text;
    };
    display.addEventListener('click',e=>{
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    options.forEach(opt=>{
      opt.addEventListener('click',e=>{
        e.stopPropagation();
        set(opt.dataset.value,opt.textContent);
        dropdown.classList.remove('open');
        dropdown.dispatchEvent(new Event('change'));
      });
    });
    if(initial){
      const o=options.find(op=>op.dataset.value===initial);
      if(o) set(o.dataset.value,o.textContent);
    } else if(options[0]) {
      set(options[0].dataset.value,options[0].textContent);
    }
  }
  function closeAll(e){
    document.querySelectorAll('.dropdown.open').forEach(d=>{
      if(!d.contains(e.target)) d.classList.remove('open');
    });
  }
  window.setupDropdowns=function(){
    document.querySelectorAll('.dropdown').forEach(d=>{
      init(d,d.dataset.value);
    });
    document.addEventListener('click',closeAll);
  };
})();
