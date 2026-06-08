import { ThreePresenter } from '../ThreePresenter';
import { ThreePresenterSkin } from './ThreePresenterSkin';
import { UIControlsBuilder, type ButtonConfig, type ContainerConfig } from './UIControlsBuilder';

export interface DefaultUIConfig {
    container?: Partial<ContainerConfig>;
    useSkinIcons?: boolean;
    skinUrl?: string;
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
 * - Measure toggle - two-click distance measuring mode
 * - Camera mode switch - toggle between perspective and orthographic
 * - Screenshot capture - save current view as image
 * - Fullscreen toggle - enter/exit fullscreen mode (bottom-right corner)
 * 
 * All buttons are hidden by default and must be enabled individually using
 * `setButtonVisible(id, true)`. Available button IDs: 'home', 'light', 'lightPosition',
 * 'env', 'screenshot', 'camera', 'annotation', 'measure', 'fullscreen'.
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
    private readonly useSkinIcons: boolean;
    private envLightingEnabled: boolean = true;
    private lightPresetIndex: number = -1;
    private readonly lightPositionPresets: Array<{ theta: number; phi: number; label: string }> = [
        { theta: 0, phi: 0, label: 'Frontal' },
        { theta: 30, phi: 15, label: 'Top-right' },
        { theta: -30, phi: 15, label: 'Top-left' },
        { theta: 180, phi: 10, label: 'Back light' }
    ];
    private readonly onFullscreenChange = () => this.updateFullscreenButton();

    constructor(private presenter: ThreePresenter, config: DefaultUIConfig = {}) {
        this.useSkinIcons = config.useSkinIcons ?? true;

        if (config.skinUrl) {
            ThreePresenterSkin.setUrl(config.skinUrl);
        }

        const buttonConfigs: ButtonConfig[] = [
            {
                id: 'home',
                icon: 'bi-house',
                skinSelector: this.useSkinIcons ? '.tp-home' : undefined,
                title: 'Reset camera view',
                onClick: () => presenter.resetCamera(),
                visible: false
            },
            {
                id: 'light',
                icon: 'bi-lightbulb-fill', // Initial state assumes light ON
                skinSelector: this.useSkinIcons ? '.tp-light-on' : undefined,
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
                skinSelector: this.useSkinIcons ? '.tp-light-position' : undefined,
                title: 'Cycle headlight direction',
                onClick: () => this.cycleLightPosition(),
                visible: false
            },
            {
                id: 'env',
                icon: 'bi-globe',
                skinSelector: this.useSkinIcons ? '.tp-env-on' : undefined,
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
                skinSelector: this.useSkinIcons ? '.tp-screenshot' : undefined,
                title: 'Take screenshot',
                onClick: () => presenter.takeScreenshot(),
                visible: false
            },
            {
                id: 'camera',
                icon: 'bi-box',
                skinSelector: this.useSkinIcons ? '.tp-camera-perspective' : undefined,
                title: 'Toggle orthographic/perspective',
                onClick: () => presenter.toggleCameraMode(),
                visible: false
            },
            {
                id: 'annotation',
                icon: 'bi-pencil',
                skinSelector: this.useSkinIcons ? '.tp-annotation' : undefined,
                title: 'Add annotation',
                onClick: () => presenter.togglePickingMode(),
                visible: false
            },
            {
                id: 'measure',
                icon: 'bi-rulers',
                skinSelector: this.useSkinIcons ? '.tp-measure' : undefined,
                title: 'Measure distance',
                onClick: () => presenter.toggleMeasurementMode(),
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
            skinSelector: this.useSkinIcons ? '.tp-fullscreen-enter' : undefined,
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
        document.addEventListener('fullscreenchange', this.onFullscreenChange);
        this.updateFullscreenButton();
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
        const isFullscreen = !!document.fullscreenElement;
        this.setButtonIcon(
            'fullscreen',
            isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen',
            isFullscreen ? '.tp-fullscreen-exit' : '.tp-fullscreen-enter'
        );
    }

    private cycleLightPosition() {
        this.lightPresetIndex = (this.lightPresetIndex + 1) % this.lightPositionPresets.length;
        const preset = this.lightPositionPresets[this.lightPresetIndex];
        this.presenter.setHeadLightOffset(preset.theta, preset.phi);

        const btn = this.buttons.get('lightPosition');
        if (btn) {
            btn.title = `Headlight: ${preset.label} (${preset.theta}\u00b0, ${preset.phi}\u00b0)`;
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

        const originalOnMeasurementModeChange = this.presenter.onMeasurementModeChange;
        this.presenter.onMeasurementModeChange = (enabled: boolean) => {
            this.updateMeasureButton(enabled);
            if (originalOnMeasurementModeChange) originalOnMeasurementModeChange(enabled);
        };
    }

    updateLightButton() {
        const enabled = this.presenter.lightEnabled;
        this.setButtonIcon(
            'light',
            enabled ? 'bi-lightbulb-fill' : 'bi-lightbulb',
            enabled ? '.tp-light-on' : '.tp-light-off'
        );
    }

    updateEnvButton() {
        this.setButtonIcon(
            'env',
            this.envLightingEnabled ? 'bi-globe' : 'bi-globe-alt',
            this.envLightingEnabled ? '.tp-env-on' : '.tp-env-off'
        );
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
            this.setButtonIcon(
                'camera',
                isOrthographic ? 'bi-bounding-box-circles' : 'bi-box',
                isOrthographic ? '.tp-camera-orthographic' : '.tp-camera-perspective'
            );
            btn.style.opacity = isOrthographic ? '0.7' : '1';
        }
    }

    updateMeasureButton(enabled: boolean) {
        const btn = this.buttons.get('measure');
        if (btn) {
            if (enabled) {
                btn.style.backgroundColor = '#198754';
                btn.style.color = 'white';
            } else {
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }
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

    private setButtonIcon(id: string, bootstrapIcon: string, skinSelector?: string) {
        const btn = this.buttons.get(id);
        if (!btn) {
            return;
        }

        btn.innerHTML = `<i class="bi ${bootstrapIcon}"></i>`;

        if (!this.useSkinIcons || !skinSelector) {
            return;
        }

        const renderToken = `${id}:${skinSelector}:${Date.now()}:${Math.random()}`;
        btn.dataset.tpSkinRenderToken = renderToken;

        void this.applySkinIcon(btn, skinSelector, renderToken);
    }

    private async applySkinIcon(button: HTMLButtonElement, skinSelector: string, renderToken: string) {
        try {
            const icon = await ThreePresenterSkin.createIcon(skinSelector);
            if (button.dataset.tpSkinRenderToken !== renderToken) {
                return;
            }
            button.replaceChildren(icon);
        } catch (error) {
            console.warn(`DefaultUI: failed to apply skin icon '${skinSelector}'`, error);
        }
    }

    dispose() {
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.fullscreenContainer.parentNode) {
            this.fullscreenContainer.parentNode.removeChild(this.fullscreenContainer);
        }
        document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    }
}
