/**
 * @author: Leonid Vinikov <czf.leo123@gmail.com>
 * @description: Main File
 */
import 'CORE';

import * as services from 'SERVICES';
import * as components from 'COMPONENTS';
import * as pages from 'PAGES';

class App {
	/**
	 * Function constructor() : Create App
	 */
	constructor() {
		services.Terminal.initialize();

		this.logger = new $core.modules.Logger( this, true );
		this.logger.setOutputHandler( services.Terminal.onOutput );

		this.logger.startEmpty();

		this.sidebar = new components.Sidebar( window.document.querySelector( '#sidebar' ).parentElement );

		this.elements = {
			header: {
				logo: $core.Factory.createElement( 'header #logo' ),
				toggle: $core.Factory.createElement( 'header #toggle' ),
				cart: $core.Factory.createElement( 'header #toggle .cart' ),
				amount: $core.Factory.createElement( 'header #toggle .amount' ),
				spinner: $core.Factory.createElement( 'header #toggle .spinner' )
			},

			sidebar: {
				self: $core.Factory.createElement( '#sidebar' ), // TODO: Self should not be exist, if you use self, it should be component.
				closeButton: $core.Factory.createElement( '#sidebar #close' ),
			},

			sections: {
				main: $core.Factory.createElement( "section.main" )
			}
		};

		this.container = new $core.Container( this.elements.sections.main, '<div class="page container"></div>' );

		this.pages = {
			catalog: new pages.Catalog( this.container, '<div class="pages catalog"></div>' ),
			checkout: new pages.Checkout( this.container, '<div class="pages checkout">' +
				'   <h1>Check OUT.</h1>' +
				'</div>'
			),
		}
	}

	/**
	 * Function initialize() : Initialize App
	 */
	initialize() {
		this.logger.startEmpty();

		this.hookSidebar();
		this.hookCatalog();
		this.hookCart();

		this.container.set( this.pages.catalog );
		this.container.render();
	}

	hookSidebar() {
		const { header } = this.elements;

		header.logo.click( () => {
			this.container.set( this.pages.catalog );
			this.container.render();
		} );

		header.toggle.click( () => $core.commands.run( 'Components/Sidebar/Commands/Toggle', { state: true } ) );

		$core.commands.onBefore( 'Components/Sidebar/Commands/Toggle', ( args ) => {
			// Toggle virtual cart state.
			$core.internal.run( 'Components/Cart/Internal/ToggleState', args );
		} );
	}

	hookCatalog() {
		// On adding item from catalog.
		$core.commands.onAfter( 'Components/Catalog/Commands/Add', ( args ) => {
			// Add item to cart.
			$core.internal.run( 'Components/Cart/Internal/Add', {
				...args.component.model.getModelData(),
				amount: args.component.elements.amount.value,
			} );

			// Toggle sidebar and show cart
			$core.commands.run( 'Components/Sidebar/Commands/Toggle' );
		} );

		// On receive catalog.
		$core.data.onAfterOnce( 'Components/Catalog/Data/Index', () => {
			// Initialize cart.
			this.cart = new components.Cart( this.elements.sidebar.self, this.apis );

			// Request the cart from the server.
			$core.data.get( 'Components/Cart/Data/Index' );
		} );
	}

	hookCart() {
		// On cart update total.
		$core.internal.onAfter( 'Components/Cart/Internal/UpdateTotal', () => {
			let totalItemsInCartCount = 0;

			// Get total from all products in cart.
			this.cart.model.items.forEach( ( item ) => {
				totalItemsInCartCount += item.model.amount
			} );

			// Update total amount in DOM.
			const { amount } = this.elements.header;

			amount.html( totalItemsInCartCount );

			totalItemsInCartCount ? amount.show() : amount.hide();
		} );

		// On cart checkout button click.
		$core.commands.onAfter( 'Components/Cart/Commands/Checkout', () => {
			// Toggle the sidebar off.
			$core.commands.run( 'Components/Sidebar/Commands/Toggle', { state: false } );

			// Select checkout page.
			this.container.set( this.pages.checkout );
			this.container.render();
		} );

		// On receiving cart data from server.
		$core.data.onAfter( 'Components/Cart/Data/Index', async ( args ) => {
			// If its first time.
			if ( ! this.cartRecvOnce ) {
				this.cartRecvOnce = true;

				const { cart, spinner } = this.elements.header;

				// Hide the spinner and show cart.
				cart.show();
				spinner.hide();
			}

			// Not all the products that are in cart exist locally, since the catalog loaded by request and get the data per page.
			// Find out missing product and request it from the server.
			const cartItems = args.result,
				// Get local items from the catalog.
				localCatalogItems = await $core.data.get( 'Components/Catalog/Data/Index', {}, { local: true } ),
				missingProducts = [];

			// Find out missing products.
			cartItems.forEach( ( cartItem ) => {
				const localItem = localCatalogItems.find( ( localItem ) => localItem.id === cartItem.id );

				if ( ! localItem ) {
					missingProducts.push( cartItem.id );
				}
			} );

			const addCartItems = ( items, missing = [] ) => {
				items.forEach( ( item ) => {
					// If that item is the missing item, assign his values to current item.
					const missedItem = missing.find( ( missingItem ) => missingItem.id === item.id );

					// If item find as missing, merge his values to current item.
					// else get item from the catalog.
					if ( missedItem ) {
						item = Object.assign( item, missedItem );
					} else {
						item = Object.assign( item, localCatalogItems.find( ( localItem ) => localItem.id === item.id ) );
					}

					// Add missing product to the cart.
					$core.internal.run( 'Components/Cart/Internal/Add', item, { local: true } )
				} );

				this.cart.render();
			}

			if ( ! missingProducts.length ) {
				addCartItems( cartItems );

				return;
			}

			// Request missing products, On receiving missing products, add cart items to catalog.
			$core.data.get( 'Components/Catalog/Data/Get', { ids: missingProducts } )
				.then( ( missing ) => addCartItems( cartItems, missing ) )
		} );
	}
}

document.addEventListener( 'readystatechange', () => {
	if ( window.initOnce ) {
		return;
	}

	window.$app = new App();

	$app.initialize();

	window.initOnce = true;
} );

