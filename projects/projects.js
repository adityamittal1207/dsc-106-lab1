import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedYear = null;

function getVisibleProjects(projectsGiven) {
  if (selectedYear === null) {
    return projectsGiven;
  }
  return projectsGiven.filter((project) => project.year === selectedYear);
}

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));
  // clear up paths and legends
  let newSVG = d3.select('svg');
  newSVG.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();
  function highlightSelected() {
    newSVG
      .selectAll('path')
      .attr('class', (_, idx) => (newData[idx].label === selectedYear ? 'selected' : ''));

    legend
      .selectAll('li')
      .attr('class', (_, idx) =>
        newData[idx].label === selectedYear ? 'legend-item selected' : 'legend-item',
      );
  }

  function selectWedge(i) {
    let year = newData[i].label;
    selectedYear = selectedYear === year ? null : year;
    highlightSelected();
    renderProjects(getVisibleProjects(setQuery(query)), projectsContainer, 'h2');
  }

  // update paths and legends, refer to steps 1.4 and 2.2
  newArcs.forEach((arc, idx) => {
    newSVG
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
      .on('click', () => selectWedge(idx));
  });
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`) // set the inner html of <li>
      .on('click', () => selectWedge(idx));
  });
  highlightSelected();
}

// Call this function on page load
renderPieChart(projects);

let query = '';
let searchInput = document.querySelector('.searchBar');

function setQuery(value) {
  // update query value
  query = value;
  // filter projects
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

searchInput.addEventListener('change', (event) => {
  let filteredProjects = setQuery(event.target.value);
  if (!filteredProjects.some((project) => project.year === selectedYear)) {
    selectedYear = null;
  }
  renderProjects(getVisibleProjects(filteredProjects), projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});
