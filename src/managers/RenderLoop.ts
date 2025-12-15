/**
 * RenderLoop - Manages the animation loop using requestAnimationFrame
 */
export class RenderLoop {
    private isRunning: boolean = false;
    private animationFrameId: number | null = null;
    private callbacks: Set<(time: number, delta: number) => void> = new Set();
    private lastTime: number = 0;

    constructor() {
        this.animate = this.animate.bind(this);
    }

    /**
     * Start the animation loop
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
        console.log('🔄 Render loop started');
    }

    /**
     * Stop the animation loop
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        console.log('🛑 Render loop stopped');
    }

    /**
     * Add a callback to be executed on every frame
     * @param callback Function receiving total time and delta time
     */
    addCallback(callback: (time: number, delta: number) => void) {
        this.callbacks.add(callback);
    }

    /**
     * Remove a registered callback
     */
    removeCallback(callback: (time: number, delta: number) => void) {
        this.callbacks.delete(callback);
    }

    /**
     * The internal animation loop
     */
    private animate() {
        if (!this.isRunning) return;

        const time = performance.now();
        const delta = time - this.lastTime;
        this.lastTime = time;

        this.callbacks.forEach(callback => {
            try {
                callback(time, delta);
            } catch (error) {
                console.error('Error in render loop callback:', error);
            }
        });

        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    /**
     * Dispose and stop the loop
     */
    dispose() {
        this.stop();
        this.callbacks.clear();
    }
}
