import React from 'react'
import { withGoogleMap, GoogleMap, withScriptjs, InfoWindow, Marker } from "react-google-maps";
import Autocomplete from 'react-google-autocomplete';
import Geocode from "react-geocode";
Geocode.setApiKey("");
Geocode.enableDebug();
Geocode.setRegion("no");
export class Map extends React.Component{
    constructor( props ){
        super( props );
        this.state = {
            address: '',
            city: '',
            area: '',
            state: '',
            mapPosition: {
                lat: this.props.center.lat,
                lng: this.props.center.lng
            },
            markerPosition: {
                lat: this.props.center.lat,
                lng: this.props.center.lng
            },
            readonly: (props.readonly ? props.readonly : false)
        };

        console.log("Read only:" + this.props.readonly);
    }
    /**
     * Get the current address from the default map position and set those values in the state
     */
    componentDidMount() {
        if (this.props.currentAddress) {
            console.log(this.props.currentAddress);
            // Get latidude & longitude from address.
            Geocode.fromAddress(this.props.currentAddress).then(
                response => {
                    const { lat, lng } = response.results[0].geometry.location;
                    this.setState({markerPosition: {lat: lat, lng: lng}});
                    Geocode.fromLatLng( lat , lng ).then(
                        response => {
                            const address = response.results[0].formatted_address,
                                addressArray =  response.results[0].address_components,
                                city = this.getCity( addressArray ),
                                area = this.getArea( addressArray ),
                                state = this.getState( addressArray );

                            console.log( 'city', city, area, state );

                            this.setState( {
                                address: ( address ) ? address : '',
                                area: ( area ) ? area : '',
                                city: ( city ) ? city : '',
                                state: ( state ) ? state : '',
                            } )
                        },
                        error => {
                            console.error(error);
                        }
                    );
                },
                error => {
                    console.error(error);
                }
            );
        } else {
            Geocode.fromLatLng( this.state.mapPosition.lat , this.state.mapPosition.lng ).then(
                response => {
                    const address = response.results[0].formatted_address,
                        addressArray =  response.results[0].address_components,
                        city = this.getCity( addressArray ),
                        area = this.getArea( addressArray ),
                        state = this.getState( addressArray );

                    console.log( 'city', city, area, state );

                    this.setState( {
                        address: ( address ) ? address : '',
                        area: ( area ) ? area : '',
                        city: ( city ) ? city : '',
                        state: ( state ) ? state : '',
                    } )
                },
                error => {
                    console.error(error);
                }
            );
        }
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.currentAddress !== this.props.currentAddress)
            this.componentDidMount();
    }

    /**
     * Component should only update ( meaning re-render ), when the user selects the address, or drags the pin
     *
     * @param nextProps
     * @param nextState
     * @return {boolean}
     */
    shouldComponentUpdate( nextProps, nextState ){
        if (
            this.state.markerPosition.lat !== this.props.center.lat ||
            this.state.address !== nextState.address ||
            this.state.city !== nextState.city ||
            this.state.area !== nextState.area ||
            this.state.state !== nextState.state ||
            this.props.currentAddress !== nextProps.currentAddress
        ) {
            return true
        } else if ( this.props.center.lat === nextProps.center.lat ){
            return false
        }
    }
    /**
     * Get the city and set the city input value to the one selected
     *
     * @param addressArray
     * @return {string}
     */
    getCity = ( addressArray ) => {
        let city = '';
        for( let i = 0; i < addressArray.length; i++ ) {
            if ( addressArray[ i ].types[0] && 'administrative_area_level_2' === addressArray[ i ].types[0] ) {
                city = addressArray[ i ].long_name;
                return city;
            }
        }
    };
    /**
     * Get the area and set the area input value to the one selected
     *
     * @param addressArray
     * @return {string}
     */
    getArea = ( addressArray ) => {
        let area = '';
        for( let i = 0; i < addressArray.length; i++ ) {
            if ( addressArray[ i ].types[0]  ) {
                for ( let j = 0; j < addressArray[ i ].types.length; j++ ) {
                    if ( 'sublocality_level_1' === addressArray[ i ].types[j] || 'locality' === addressArray[ i ].types[j] ) {
                        area = addressArray[ i ].long_name;
                        return area;
                    }
                }
            }
        }
    };
    /**
     * Get the address and set the address input value to the one selected
     *
     * @param addressArray
     * @return {string}
     */
    getState = ( addressArray ) => {
        let state = '';
        for( let i = 0; i < addressArray.length; i++ ) {
            for( let i = 0; i < addressArray.length; i++ ) {
                if ( addressArray[ i ].types[0] && 'administrative_area_level_1' === addressArray[ i ].types[0] ) {
                    state = addressArray[ i ].long_name;
                    return state;
                }
            }
        }
    };
    /**
     * And function for city,state and address input
     * @param event
     */
    onChange = ( event ) => {
        this.setState({ [event.target.name]: event.target.value });
    };
    /**
     * This Event triggers when the marker window is closed
     *
     * @param event
     */
    onInfoWindowClose = ( event ) => {
    };
    /**
     * When the user types an address in the search box
     * @param place
     */
    onPlaceSelected = ( place ) => {
        const address = place.formatted_address,
            addressArray =  place.address_components,
            city = this.getCity( addressArray ),
            area = this.getArea( addressArray ),
            state = this.getState( addressArray ),
            latValue = place.geometry.location.lat(),
            lngValue = place.geometry.location.lng();
// Set these values in the state.
        this.setState({
            address: ( address ) ? address : '',
            area: ( area ) ? area : '',
            city: ( city ) ? city : '',
            state: ( state ) ? state : '',
            markerPosition: {
                lat: latValue,
                lng: lngValue
            },
            mapPosition: {
                lat: latValue,
                lng: lngValue
            },
        }, res => {
            this.onChangeAddress(null);
        })
    };
    /**
     * When the marker is dragged you get the lat and long using the functions available from event object.
     * Use geocode to get the address, city, area and state from the lat and lng positions.
     * And then set those values in the state.
     *
     * @param event
     */
    onMarkerDragEnd = ( event ) => {
        console.log( 'event', event );
        let newLat = event.latLng.lat(),
            newLng = event.latLng.lng(),
            addressArray = [];
        Geocode.fromLatLng( newLat , newLng ).then(
            response => {
                const address = response.results[0].formatted_address,
                    addressArray =  response.results[0].address_components,
                    city = this.getCity( addressArray ),
                    area = this.getArea( addressArray ),
                    state = this.getState( addressArray ),
                    latValue = newLat,
                    lngValue = newLng;
                this.setState( {
                    address: ( address ) ? address : '',
                    area: ( area ) ? area : '',
                    city: ( city ) ? city : '',
                    state: ( state ) ? state : '',
                    markerPosition: {
                        lat: latValue,
                        lng: lngValue
                    },
                    mapPosition: {
                        lat: latValue,
                        lng: lngValue
                    },
                }, (res) => {
                    this.onChangeAddress();
                });
            },
            error => {
                console.error(error);
            }
        );
    };

    getAddress() {
        this.props.onChange(this.state.address);
    }

    onChangeAddress(e) {
        this.props.onChange(this.state.address);
    }

    testFunction() {
        this.getAddress();
        this.onChange();
    }

    render(){
        const AsyncMap = withScriptjs(
            withGoogleMap(
                props => (
                    <GoogleMap google={this.props.google}
                               defaultZoom={this.props.zoom}
                               defaultCenter={{ lat: this.state.mapPosition.lat, lng: this.state.mapPosition.lng }}
                    >
                        {/*Marker*/}

                        <Marker google={this.props.google}
                                name={'Dolores park'}
                                draggable={!this.state.readonly}
                                onDragEnd={ this.onMarkerDragEnd }
                                position={{ lat: this.state.markerPosition.lat, lng: this.state.markerPosition.lng }}
                        />
                        <InfoWindow
                            onClose={this.onInfoWindowClose}
                            position={{ lat: ( this.state.markerPosition.lat + 0.0018 ), lng: this.state.markerPosition.lng }}>
                            <div>
                                <span style={{ padding: 0, margin: 0 }}>{ this.state.address }</span>
                            </div>
                        </InfoWindow>

                        {!this.state.readonly ?
                            <div>
                                {/* For Auto complete Search Box */}
                                <Autocomplete
                                    style={{
                                        width: '100%',
                                        height: '40px',
                                        paddingLeft: '16px',
                                        marginTop: '2px',
                                        marginBottom: '100px'
                                    }}
                                    onPlaceSelected={ this.onPlaceSelected }
                                    types={['(regions)']}
                                />
                            </div>
                        : null}
                        {/* InfoWindow on top of marker */}

                    </GoogleMap>
                )
            )
        );
        let map;
        if( this.props.center.lat !== undefined ) {
            map = <div>
                <AsyncMap
                    googleMapURL="https://maps.googleapis.com/maps/api/js?key=&libraries=places"
                    loadingElement={
                        <div style={{ height: `100%` }} />
                    }
                    containerElement={
                        <div style={{ height: this.props.height }} />
                    }
                    mapElement={
                        <div style={{ height: `100%` }} />
                    }
                />
                <br/>
                <br/>
                <div>
                    {/*<div className="form-group">
                        <label htmlFor="">By</label>
                        <input type="text" name="city" className="form-control" onChange={ this.onChange } readOnly="readOnly" value={ this.state.city }/>
                    </div>*/}
{/*                    <div className="form-group">
                        <label htmlFor="">Area</label>
                        <input type="text" name="area" className="form-control" onChange={ this.onChange } readOnly="readOnly" value={ this.state.area }/>
                    </div>*/}
                    {/*<div className="form-group">
                        <label htmlFor="">Fylke</label>
                        <input type="text" name="state" className="form-control" onChange={ this.onChange } readOnly="readOnly" value={ this.state.state }/>
                    </div>*/}
                    {!this.state.readonly ?
                        <div className="form-group">
                            <label htmlFor="">Adresse</label>
                            <input type="text" name="address" className="form-control" readOnly value={ this.state.address }/>
                        </div>
                    : null}
                </div>

            </div>
        } else {
            map = <div style={{height: this.props.height}} />
        }
        return( map )
    }
}
export default Map