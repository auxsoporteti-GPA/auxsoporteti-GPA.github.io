const createOdometer = (el, value, format) => {
    const odometer = new Odometer({
        el: el,
        value: 0,
        format: format
    }); 

    let hasRun = false;

    const options = {
        threshold: [0, 0.9],
    };

    const callback=(entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                if(!hasRun) {
                    odometer.update(value);
                    hasRun = true;
                }
            }
        });
    };
    
    const observer = new IntersectionObserver(callback, options);
    observer.observe(el);
};

const anioOdometer = document.querySelector('.anio-odometer');
createOdometer(anioOdometer, 1986, 'd');

const agentesOdometer = document.querySelector('.agentes-odometer');
createOdometer(agentesOdometer, 30000, '(,ddd)');

const sucursalesOdometer = document.querySelector('.sucursales-odometer');
createOdometer(sucursalesOdometer, 3, '(,ddd)');