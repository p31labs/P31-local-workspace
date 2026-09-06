import rolePacketsJson from './data/role-packets.json';
import workSamplesJson from './data/work-samples.json';
import helpTopicsJson from './data/help-topics.json';
import glossaryJson from './data/glossary.json';
import changelogJson from './data/changelog.json';
import type {
  RolePacketsData,
  WorkSamplesData,
  HelpData,
  GlossaryData,
  ChangelogData,
  HashRoute
} from './types';
import type { AppModel } from './appModel';
import { buildSearchDocs, createSearchFuse } from './lib/buildSearchIndex';
import { parseHash } from './router';
import { renderShell, activeFromRoute } from './render/shell';
import { renderHomeBody } from './render/homePage';
import { renderRoleList, renderRoleDetail, roleDetailWire } from './render/rolesView';
import {
  renderHelpList,
  renderHelpTopic,
  renderGlossaryList,
  renderGlossaryTerm,
  renderWcdList,
  renderWcdDetail,
  renderChangelog,
  renderGovernance,
  renderReviewers,
  renderSearch
} from './render/knowledgeView';
import { renderPortfolio, openNewProof, openEditProof } from './render/proofView';
import { announceStatus, focusMainTarget } from './lib/announce';

const rolePackets = rolePacketsJson as unknown as RolePacketsData;
const workSamples = workSamplesJson as unknown as WorkSamplesData;
const help = helpTopicsJson as unknown as HelpData;
const glossary = glossaryJson as unknown as GlossaryData;
const changelog = changelogJson as unknown as ChangelogData;

const model: AppModel = {
  rolePackets,
  workSamples,
  help,
  glossary,
  changelog,
  fuse: createSearchFuse(
    buildSearchDocs(help, glossary, rolePackets.roles, workSamples)
  )
};

export function mountHiringApp(root: HTMLElement): void {
  const run = (route: HashRoute) => {
    switch (route.name) {
      case 'home':
        root.innerHTML = renderShell(activeFromRoute('home'), renderHomeBody(model));
        announceStatus('P31 Delta hiring home');
        break;
      case 'roles': {
        if (route.id) {
          root.innerHTML = renderShell(
            activeFromRoute('roles'),
            renderRoleDetail(model, route.id)
          );
          roleDetailWire(model);
          announceStatus('Role packet');
        } else {
          const { html, wire } = renderRoleList(model, () => run(parseHash()));
          root.innerHTML = renderShell(activeFromRoute('roles'), html);
          wire();
          announceStatus('Open roles');
        }
        break;
      }
      case 'wcd-list':
        root.innerHTML = renderShell(activeFromRoute('wcd-list'), renderWcdList(model));
        announceStatus('WCD library');
        break;
      case 'wcd':
        root.innerHTML = renderShell(
          activeFromRoute('wcd'),
          route.id ? renderWcdDetail(model, route.id) : renderWcdList(model)
        );
        announceStatus('Work sample');
        break;
      case 'help-list':
        root.innerHTML = renderShell(activeFromRoute('help-list'), renderHelpList(model));
        announceStatus('Help center');
        break;
      case 'help':
        root.innerHTML = renderShell(
          activeFromRoute('help'),
          route.id ? renderHelpTopic(model, route.id) : renderHelpList(model)
        );
        announceStatus('Help topic');
        break;
      case 'glossary-list':
        root.innerHTML = renderShell(
          activeFromRoute('glossary-list'),
          renderGlossaryList(model)
        );
        announceStatus('Glossary');
        break;
      case 'glossary':
        root.innerHTML = renderShell(
          activeFromRoute('glossary'),
          route.id ? renderGlossaryTerm(model, route.id) : renderGlossaryList(model)
        );
        announceStatus('Glossary term');
        break;
      case 'changelog':
        root.innerHTML = renderShell(activeFromRoute('changelog'), renderChangelog(model));
        announceStatus('Changelog');
        break;
      case 'governance':
        root.innerHTML = renderShell(activeFromRoute('governance'), renderGovernance());
        announceStatus('Governance');
        break;
      case 'reviewers':
        root.innerHTML = renderShell(activeFromRoute('reviewers'), renderReviewers());
        announceStatus('Reviewers');
        break;
      case 'search': {
        const { html, wire } = renderSearch(model, route.query ?? '', () =>
          run(parseHash())
        );
        root.innerHTML = renderShell(activeFromRoute('search'), html);
        wire();
        announceStatus('Search');
        break;
      }
      case 'portfolio': {
        const { html, wire } = renderPortfolio(model, () => run(parseHash()));
        root.innerHTML = renderShell(activeFromRoute('portfolio'), html);
        wire();
        announceStatus('My proofs');
        break;
      }
      case 'proof-new':
        if (route.id) {
          openNewProof(model, root, route.id, () => run(parseHash()));
        } else {
          root.innerHTML = renderShell('portfolio', `<p>Missing role.</p>`);
        }
        break;
      case 'proof':
        if (route.id) {
          openEditProof(model, root, route.id, () => run(parseHash()));
        } else {
          root.innerHTML = renderShell('portfolio', `<p>Missing id.</p>`);
        }
        break;
      default:
        root.innerHTML = renderShell(
          'home',
          `<div class="card"><p>Unknown route.</p><a href="#/">Home</a></div>`
        );
    }
    requestAnimationFrame(() => focusMainTarget());
  };

  const refresh = () => run(parseHash());
  window.addEventListener('hashchange', refresh);
  refresh();
}
