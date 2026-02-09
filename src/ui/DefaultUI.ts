import { ThreePresenter } from '../ThreePresenter';
import { UIControlsBuilder, type ButtonConfig, type ContainerConfig } from './UIControlsBuilder';

export interface DefaultUIConfig {
    container?: Partial<ContainerConfig>;
}

/**
 * DefaultUI - Standard UI overlay for ThreePresenter
 * 
 * Provides a ready-to-use UI control panel with buttons for common 3D viewer operations.
 * This class demonstrates how to build a UI on top of ThreePresenter without tight coupling.
 * 
 * Features:
 * - Home/Reset button - returns camera to default view
 * - Light toggle - enable/disable head lighting
 * - Light position control - adjust light direction relative to camera
 * - Environment lighting - toggle HDRI/environment map
 * - Annotation toggle - enable/disable picking mode
 * - Camera mode switch - toggle between perspective and orthographic
 * - Screenshot capture - save current view as image
 * - Fullscreen toggle - enter/exit fullscreen mode (bottom-right corner)
 * 
 * All buttons are hidden by default and must be enabled individually using
 * `setButtonVisible(id, true)`. Available button IDs: 'home', 'light', 'lightPosition',
 * 'env', 'screenshot', 'camera', 'annotation', 'fullscreen'.
 * 
 * The UI responds to state changes via callbacks, keeping it in sync with the
 * presenter's internal state.
 * 
 * @example
 * ```typescript
 * const presenter = new ThreePresenter(container);
 * const ui = new DefaultUI(presenter, {
 *   container: {
 *     position: 'top-left',
 *     gap: 12
 *   }
 * });
 * 
 * // Show only specific buttons
 * ui.setButtonVisible('home', true);
 * ui.setButtonVisible('screenshot', true);
 * ui.setButtonVisible('fullscreen', true);
 * ```
 * 
 * @see {@link UIControlsBuilder} for button creation details
 * @see {@link ThreePresenter} for the main presenter class
 */
export class DefaultUI {
    container: HTMLDivElement;
    fullscreenContainer: HTMLDivElement;
    buttons: Map<string, HTMLButtonElement>;
    private envLightingEnabled: boolean = true;

    constructor(private presenter: ThreePresenter, config: DefaultUIConfig = {}) {
        const buttonConfigs: ButtonConfig[] = [
            {
                id: 'home',
                icon: 'bi-house',
                title: 'Reset camera view',
                onClick: () => presenter.resetCamera(),
                visible: false
            },
            {
                id: 'light',
                icon: 'bi-lightbulb-fill', // Initial state assumes light ON
                title: 'Toggle lighting',
                onClick: () => {
                    presenter.toggleLight();
                    this.updateLightButton();
                },
                visible: false
            },
            {
                id: 'lightPosition',
                icon: 'bi-brightness-high',
                customHTML: `
          <div style="position: relative; width: 16px; height: 16px;">
            <i class="bi bi-brightness-high" style="position: absolute; top: -10px; left: -4px; font-size: 24px;"></i>
            <i class="bi bi-arrows-move" style="position: absolute; font-size: 32px; top: -16px; left: -8px;"></i>
          </div>
        `,
                title: 'Position headlight',
                onClick: () => { }, // TODO: Add light positioning functionality
                visible: false
            },
            {
                id: 'env',
                icon: 'bi-globe',
                title: 'Toggle environment lighting',
                onClick: () => {
                    presenter.toggleEnvLighting();
                    this.updateEnvButton();
                },
                visible: false
            },
            {
                id: 'screenshot',
                icon: 'bi-camera',
                title: 'Take screenshot',
                onClick: () => presenter.takeScreenshot(),
                visible: false
            },
            {
                id: 'camera',
                icon: 'bi-box',
                title: 'Toggle orthographic/perspective',
                onClick: () => presenter.toggleCameraMode(),
                visible: false
            },
            {
                id: 'annotation',
                icon: 'bi-pencil',
                title: 'Add annotation',
                onClick: () => presenter.togglePickingMode(),
                visible: false
            }
        ];

        const builder = new UIControlsBuilder();
        const result = builder
            .setContainer(config.container || {
                position: 'top-left',
                direction: 'vertical',
                gap: 'gap-2',
                zIndex: '1000'
            })
            .addButtons(buttonConfigs)
            .build();

        this.container = result.container;
        this.buttons = result.buttons;

        // Create fullscreen button in bottom-right corner
        const fullscreenButtonConfig: ButtonConfig[] = [{
            id: 'fullscreen',
            icon: 'bi-fullscreen',
            title: 'Toggle fullscreen',
            onClick: () => this.toggleFullscreen(),
            visible: false
        }];

        const fullscreenResult = new UIControlsBuilder()
            .setContainer({
                position: 'bottom-right',
                direction: 'horizontal',
                gap: 'gap-2',
                zIndex: '1000'
            })
            .addButtons(fullscreenButtonConfig)
            .build();

        this.fullscreenContainer = fullscreenResult.container;
        this.buttons.set('fullscreen', fullscreenResult.buttons.get('fullscreen')!);

        // Attach to mount
        // We assume presenter.mount is accessible or we pass mount separately?
        // ThreePresenter.mount is public.
        const mount = this.presenter.mount;
        if (getComputedStyle(mount).position === 'static') {
            mount.style.position = 'relative';
        }
        mount.appendChild(this.container);
        mount.appendChild(this.fullscreenContainer);

        // Subscribe to state changes
        this.attachListeners();

        // Listen for fullscreen changes (e.g., user presses ESC)
        document.addEventListener('fullscreenchange', () => this.updateFullscreenButton());
    }

    private toggleFullscreen() {
        const mount = this.presenter.mount;
        if (!document.fullscreenElement) {
            mount.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    private updateFullscreenButton() {
        const btn = this.buttons.get('fullscreen');
        if (btn) {
            const isFullscreen = !!document.fullscreenElement;
            btn.innerHTML = isFullscreen 
                ? '<i class="bi bi-fullscreen-exit"></i>' 
                : '<i class="bi bi-fullscreen"></i>';
        }
    }

    private attachListeners() {
        // We need ThreePresenter to expose event hooks.
        // Assuming we will add these to ThreePresenter:
        // presenter.onLightChange = (enabled) => ...

        // For now, we manually update after clicking (in onClick handlers above).
        // But if state changes from elsewhere (e.g. loadScene), we need to update.

        const originalOnLightChange = this.presenter.onLightChange;
        this.presenter.onLightChange = (enabled: boolean) => {
            this.updateLightButton();
            if (originalOnLightChange) originalOnLightChange(enabled);
        };

        const originalOnEnvChange = this.presenter.onEnvChange;
        this.presenter.onEnvChange = (enabled: boolean) => {
            this.envLightingEnabled = enabled;
            this.updateEnvButton();
            if (originalOnEnvChange) originalOnEnvChange(enabled);
        };

        const originalOnPickingModeChange = this.presenter.onPickingModeChange;
        this.presenter.onPickingModeChange = (enabled: boolean) => {
            this.updateAnnotationButton(enabled);
            if (originalOnPickingModeChange) originalOnPickingModeChange(enabled);
        };

        const originalOnCameraModeChange = this.presenter.onCameraModeChange;
        this.presenter.onCameraModeChange = (isOrthographic: boolean) => {
            this.updateCameraButton(isOrthographic);
            if (originalOnCameraModeChange) originalOnCameraModeChange(isOrthographic);
        };
    }

    updateLightButton() {
        const btn = this.buttons.get('light');
        if (btn) {
            const enabled = this.presenter.lightEnabled;
            btn.innerHTML = enabled ? '<i class="bi bi-lightbulb-fill"></i>' : '<i class="bi bi-lightbulb"></i>';
        }
    }

    updateEnvButton() {
        const btn = this.buttons.get('env');
        if (btn) {
            btn.innerHTML = this.envLightingEnabled ? '<i class="bi bi-globe"></i>' : '<i class="bi bi-globe-alt"></i>';
        }
    }

    updateAnnotationButton(enabled: boolean) {
        const btn = this.buttons.get('annotation');
        if (btn) {
            if (enabled) {
                btn.style.backgroundColor = '#0d6efd';
                btn.style.color = 'white';
            } else {
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }
        }
    }

    updateCameraButton(isOrthographic: boolean) {
        const btn = this.buttons.get('camera');
        if (btn) {
            btn.style.opacity = isOrthographic ? '0.7' : '1';
        }
    }

    setButtonVisible(id: string, visible: boolean) {
        const btn = this.buttons.get(id);
        if (btn) {
            btn.style.display = visible ? 'flex' : 'none';
        } else {
            console.warn(`DefaultUI: No button found with id '${id}'`);
        }
    }

    dispose() {
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.fullscreenContainer.parentNode) {
            this.fullscreenContainer.parentNode.removeChild(this.fullscreenContainer);
        }
        document.removeEventListener('fullscreenchange', () => this.updateFullscreenButton());
    }
}
