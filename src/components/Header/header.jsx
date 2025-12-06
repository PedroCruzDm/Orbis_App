import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const Header = () => {
    return (
        <View style={styles.header}>
            <View style={styles.nav} accessible accessibilityRole="header">
                <Text style={styles.brand}>Orbis</Text>
                <View style={styles.right} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        width: '100%',
        top: 0,
        left: 0,
        zIndex: 1000,
    },
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(3, 77, 173, 0.92)',
        
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
            },
            android: {
                elevation: 2,
            },
        }),
    },
    brand: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffffff',
        letterSpacing: 0.2,
    },
    right: {
        minWidth: 48,
    },
});

export default Header;