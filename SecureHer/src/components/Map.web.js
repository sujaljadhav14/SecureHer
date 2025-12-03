import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView = (props) => {
    return (
        <View style={[styles.container, props.style]}>
            <Text style={styles.text}>Maps are not supported on web yet.</Text>
        </View>
    );
};

export const Marker = () => null;
export const Polyline = () => null;
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    text: {
        color: '#888',
        fontSize: 16,
    },
});

export default MapView;
