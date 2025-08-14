/**
 * Kanban Board Component for Order Management
 * Drag-and-drop interface for managing order workflow
 */

import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, Clock, DollarSign, User, AlertTriangle } from 'lucide-react';
import { Order } from '../../shared/schema';

interface KanbanBoardProps {
  orders: Order[];
  onOrderUpdate: (orderId: string, newStatus: string) => void;
  onOrderClick: (order: Order) => void;
}

const ORDER_STATUSES = [
  { id: 'quote', title: 'Quotes', color: 'bg-gray-100' },
  { id: 'approved', title: 'Approved', color: 'bg-blue-100' },
  { id: 'in_production', title: 'In Production', color: 'bg-yellow-100' },
  { id: 'quality_check', title: 'Quality Check', color: 'bg-orange-100' },
  { id: 'ready', title: 'Ready for Pickup', color: 'bg-green-100' },
  { id: 'completed', title: 'Completed', color: 'bg-gray-200' }
];

interface OrderCardProps {
  order: Order;
  onOrderClick: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onOrderClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'order',
    item: { id: order.id, currentStatus: order.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'express': return 'bg-red-500';
      case 'rush': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const isOverdue = order.estimatedCompletion && new Date(order.estimatedCompletion) < new Date();

  return (
    <Card
      ref={drag}
      className={`cursor-pointer transition-all hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      } ${isOverdue ? 'border-red-300' : ''}`}
      onClick={() => onOrderClick(order)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">
            {order.orderNumber}
          </CardTitle>
          <div className="flex gap-1">
            {order.priority !== 'standard' && (
              <Badge className={`text-xs ${getPriorityColor(order.priority)} text-white`}>
                {order.priority}
              </Badge>
            )}
            {isOverdue && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-3 h-3" />
            <span className="truncate">{order.customerId}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-3 h-3" />
            <span>${order.total}</span>
            {order.paymentStatus !== 'paid' && (
              <Badge variant="outline" className="text-xs">
                {order.paymentStatus}
              </Badge>
            )}
          </div>

          {order.estimatedCompletion && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-3 h-3" />
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {new Date(order.estimatedCompletion).toLocaleDateString()}
              </span>
            </div>
          )}

          {order.artworkDescription && (
            <p className="text-xs text-gray-500 truncate">
              {order.artworkDescription}
            </p>
          )}

          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>
              {order.imageWidth && order.imageHeight 
                ? `${order.imageWidth}"×${order.imageHeight}"`
                : 'Custom size'
              }
            </span>
            <span>{order.frameStyle}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface KanbanColumnProps {
  status: typeof ORDER_STATUSES[0];
  orders: Order[];
  onOrderUpdate: (orderId: string, newStatus: string) => void;
  onOrderClick: (order: Order) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  status, 
  orders, 
  onOrderUpdate, 
  onOrderClick 
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'order',
    drop: (item: { id: string; currentStatus: string }) => {
      if (item.currentStatus !== status.id) {
        onOrderUpdate(item.id, status.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const columnOrders = orders.filter(order => order.status === status.id);
  const totalValue = columnOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);

  return (
    <div
      ref={drop}
      className={`flex-1 min-w-80 ${status.color} rounded-lg p-4 ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">{status.title}</h3>
        <div className="text-right">
          <div className="text-sm font-medium">{columnOrders.length}</div>
          <div className="text-xs text-gray-600">${totalValue.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {columnOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onOrderClick={onOrderClick}
          />
        ))}
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  orders, 
  onOrderUpdate, 
  onOrderClick 
}) => {
  const [workloadStats, setWorkloadStats] = useState({
    totalActive: 0,
    weeklyCapacity: 20,
    utilizationPercent: 0
  });

  useEffect(() => {
    const activeOrders = orders.filter(order => 
      ['approved', 'in_production', 'quality_check'].includes(order.status)
    ).length;
    
    const utilization = (activeOrders / 20) * 100;
    
    setWorkloadStats({
      totalActive: activeOrders,
      weeklyCapacity: 20,
      utilizationPercent: Math.round(utilization)
    });
  }, [orders]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        {/* Workload Overview */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Production Overview</h2>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <div className="font-semibold text-2xl">{workloadStats.totalActive}</div>
                <div className="text-gray-600">Active Orders</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl">{workloadStats.weeklyCapacity}</div>
                <div className="text-gray-600">Weekly Capacity</div>
              </div>
              <div className="text-center">
                <div className={`font-semibold text-2xl ${
                  workloadStats.utilizationPercent > 90 ? 'text-red-600' : 
                  workloadStats.utilizationPercent > 75 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {workloadStats.utilizationPercent}%
                </div>
                <div className="text-gray-600">Utilization</div>
              </div>
            </div>
          </div>
          
          {workloadStats.utilizationPercent > 90 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Production capacity exceeded. Consider adjusting delivery dates or declining rush orders.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Kanban Columns */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ORDER_STATUSES.map((status) => (
            <KanbanColumn
              key={status.id}
              status={status}
              orders={orders}
              onOrderUpdate={onOrderUpdate}
              onOrderClick={onOrderClick}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};