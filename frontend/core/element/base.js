/**
 * @author: Leonid Vinikov <czf.leo123@gmail.com>
 * @description: nope.
 * TODO:
 */
import Context from '../context.js';
import Core from "CORE/base/core";

/**
 * @memberOf core.element
 */
export class Base extends Core {
	/**
	 * @type {HTMLElement}
	 */
	element;

	/**
	 * @type {Object}
	 */
	options;

	/**
	 * Function constructor() : Create Custom Element.
	 *
	 * @param {Node|HTMLElement|Base} parent
	 * @param {String|HTMLElement|Context} context
     * @param {{}} [options={}]
     */
    constructor( parent, context, options = {} ) {
    	super();

        if ( !parent ) {
            throw Error( 'parent is required.' );
        }

		this.context = context;
		this.parent = parent;
		this.options = options;

		if ( context instanceof HTMLElement ) {
			this.element = context;
		} else if ( ! (context instanceof Context) ) {
			context = new Context( this.context );
		} else {
			throw Error( 'context is invalid' );
		}

		this.context = context;

		this.beforeInit();

		this.initialize( options );

		this.afterInit();
	}

	static getName() {
		return 'Core/Element/Base';
	}

	initialize( options = {} ) {
	}

	render( preventDefault = false ) {
		if ( ! preventDefault ) this.beforeRender();

		let parent = this.parent;

		if ( parent instanceof Base ) {
			parent = this.parent.element;
		}

		// If its instance of HTMLElement then we assume it was rendered before.
		if ( this.context instanceof HTMLElement && this.context.isConnected ) {
			// Re-render.
			parent.removeChild( this.context );

			// Render
			parent.appendChild( this.context );
		} else if ( this.context instanceof Context ) {
			// Do not remove if its not attached to DOM.
			if ( this.element && this.element.isConnected ) {
				parent.removeChild( this.element );
			}

			// Support JSX callbacks.
			if ( 'function' === typeof parent ) {
				const _parent = parent();

				// Temporary work around for non existing elements.
				if ( !_parent ) {
					this.context.create();
					this.element = this.context.node;
                } else {
					this.element = _parent.element.appendChild( this.context.create() );
				}
			} else {
				// Render.
				this.element = parent.appendChild( this.context.create() );
			}
		}

		if ( ! preventDefault ) this.afterRender();

        return this.element;
    }

    beforeInit() {}
    afterInit() {};

    beforeRender() {}
    afterRender() {}
}

export default Base;
