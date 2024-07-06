const topbarOptions = {
    'Quit': () => window.functions.quit(),
};

const sections = {
    'Power Management': {
        'Keep Awake': (state) =>  window.functions.setStayAwake(state),
        //'Low Power Mode': (state) => console.log(`Low Power Mode is ${state ? 'on' : 'off'}`),
    },
    /*
    'Display': {
        'Night Shift': (state) => console.log(`Night Shift is ${state ? 'on' : 'off'}`),
        'True Tone': (state) => console.log(`True Tone is ${state ? 'on' : 'off'}`),
    },
    'Notifications': {
        'Do Not Disturb': (state) => console.log(`Do Not Disturb is ${state ? 'on' : 'off'}`),
        'Focus Mode': (state) => console.log(`Focus Mode is ${state ? 'on' : 'off'}`),
    }
    */
};

const hiddenSections = []; // Add section names here to hide them

function createTopbar() {
    const topbar = document.getElementById('topbar');
    
    for (const [optionName, callback] of Object.entries(topbarOptions)) {
        const button = document.createElement('button');
        button.className = 'topbar-button';
        button.textContent = optionName;
        button.addEventListener('click', callback);
        topbar.appendChild(button);
    }
}

function createSwitch(name, callback) {
    const container = document.createElement('div');
    container.className = 'switch-container';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'switch-name';
    nameSpan.textContent = name;

    const label = document.createElement('label');
    label.className = 'switch';

    const input = document.createElement('input');
    input.type = 'checkbox';

    const slider = document.createElement('span');
    slider.className = 'slider';

    label.appendChild(input);
    label.appendChild(slider);

    container.appendChild(nameSpan);
    container.appendChild(label);

    input.addEventListener('change', (event) => {
        callback(event.target.checked);
    });

    return container;
}

function createSection(name, switches) {
    const section = document.createElement('div');
    section.className = 'section';
    if (hiddenSections.includes(name)) {
        section.classList.add('hidden');
    }

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `<h2>${name}</h2><span class="expand-icon">▼</span>`;
    header.addEventListener('click', () => {
        header.classList.toggle('expanded');
        content.classList.toggle('expanded');
    });

    const content = document.createElement('div');
    content.className = 'section-content';

    for (const [switchName, callback] of Object.entries(switches)) {
        const switchElement = createSwitch(switchName, callback);
        content.appendChild(switchElement);
    }

    section.appendChild(header);
    section.appendChild(content);

    return section;
}

const sectionsContainer = document.getElementById('sections-container');

createTopbar();

for (const [sectionName, switches] of Object.entries(sections)) {
    const sectionElement = createSection(sectionName, switches);
    sectionsContainer.appendChild(sectionElement);
}