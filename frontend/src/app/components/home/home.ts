import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatCard {
    label: string;
    value: string;
    trend: string;
    positive?: boolean;
}

interface FeatureCard {
    title: string;
    description: string;
    badge: string;
}

interface ActivityItem {
    title: string;
    subtitle: string;
    time: string;
    type: 'shipment' | 'stock' | 'warehouse' | 'alert';
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './home.html',
    styleUrl: './home.css'
})
export class HomeComponent {
    statCards: StatCard[] = [
        { label: 'Active Warehouses', value: '08', trend: '+2 this quarter', positive: true },
        { label: 'Products Managed', value: '1,284', trend: '+12.4% inventory growth', positive: true },
        { label: 'Pending Shipments', value: '23', trend: '5 require action today' },
        { label: 'Low Stock Alerts', value: '14', trend: '-8 vs last week', positive: true }
    ];

    featureCards: FeatureCard[] = [
        {
            title: 'Warehouse Control',
            description: 'Track warehouse locations, stock distribution, and operational flow across every storage point.',
            badge: 'Core ERP'
        },
        {
            title: 'Shipment Lifecycle',
            description: 'Monitor draft, sent, in-transit, received, and cancelled shipments from one central workflow.',
            badge: 'Logistics'
        },
        {
            title: 'Inventory Visibility',
            description: 'Keep available, reserved, and minimum stock levels transparent for faster operational decisions.',
            badge: 'Inventory'
        },
        {
            title: 'Scalable Architecture',
            description: 'Built with a modular backend and structured frontend flow, ready for future business extensions.',
            badge: 'Engineering'
        }
    ];

    activities: ActivityItem[] = [
        {
            title: 'Shipment #1042 marked as Sent',
            subtitle: 'Central Warehouse → Retail Hub East',
            time: '12 min ago',
            type: 'shipment'
        },
        {
            title: 'Low stock threshold reached',
            subtitle: 'Product: Industrial Tape XL',
            time: '28 min ago',
            type: 'alert'
        },
        {
            title: 'Warehouse stock updated',
            subtitle: 'North Storage Facility',
            time: '42 min ago',
            type: 'stock'
        },
        {
            title: 'New warehouse activated',
            subtitle: 'Sofia Distribution Point',
            time: '1 hr ago',
            type: 'warehouse'
        }
    ];

    getActivityClass(type: ActivityItem['type']): string {
        return `activity-${type}`;
    }
}
