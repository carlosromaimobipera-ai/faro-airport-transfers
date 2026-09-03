import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Euro, Route, Save, RotateCcw, Zap, DatabaseZap } from 'lucide-react';
import { vehicleTypes, routeDistances, locations } from '@/lib/transferData';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import PriceRulesManager from '@/components/admin/PriceRulesManager';

const DEFAULT_VEHICLE_PRICES = {
  sedan: 1.00,
  premium: 1.15,
  minivan: 1.20,
  minibus: 1.40,
};

function getLocationName(id) {
  return locations.find(l => l.id === id)?.name || id;
}

export default function PriceManager() {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const [editingVehicle, setEditingVehicle] = useState({});
  const [editingRoute, setEditingRoute] = useState({});
  const [routeSearch, setRouteSearch] = useState('');
  const [precomputeStatus, setPrecomputeStatus] = useState(null);

  const { data: configs = [] } = useQuery({
    queryKey: ['price-configs'],
    queryFn: () => base44.entities.PriceConfig.list('key', 500),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ key, value, label, config_type }) => {
      const existing = configs.find(c => c.key === key);
      if (existing) {
        return base44.entities.PriceConfig.update(existing.id, { value });
      } else {
        return base44.entities.PriceConfig.create({ key, value, label, config_type });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['price-configs'] }),
  });

  // Build effective vehicle prices (DB overrides defaults)
  const vehiclePrices = useMemo(() => {
    const result = { ...DEFAULT_VEHICLE_PRICES };
    configs.filter(c => c.config_type === 'vehicle').forEach(c => {
      const id = c.key.replace('vehicle_', '');
      result[id] = c.value;
    });
    return result;
  }, [configs]);

  // Build effective route distances (DB overrides static)
  const routeOverrides = useMemo(() => {
    const result = {};
    configs.filter(c => c.config_type === 'route').forEach(c => {
      result[c.key.replace('route_', '')] = c.value;
    });
    return result;
  }, [configs]);

  const allRoutes = useMemo(() => {
    return Object.entries(routeDistances).map(([key, defaultDist]) => {
      const [originId, destId] = key.split('-');
      return {
        key,
        originId,
        destId,
        originName: getLocationName(originId),
        destName: getLocationName(destId),
        defaultDist,
        effectiveDist: routeOverrides[key] ?? defaultDist,
        isOverridden: key in routeOverrides,
      };
    });
  }, [routeOverrides]);

  const filteredRoutes = useMemo(() => {
    if (!routeSearch.trim()) return allRoutes;
    const q = routeSearch.toLowerCase();
    return allRoutes.filter(r =>
      r.originName.toLowerCase().includes(q) ||
      r.destName.toLowerCase().includes(q)
    );
  }, [allRoutes, routeSearch]);

  const saveVehicle = (vehicleId) => {
    const val = parseFloat(editingVehicle[vehicleId]);
    if (isNaN(val) || val <= 0) return;
    const vehicle = vehicleTypes.find(v => v.id === vehicleId);
    saveMutation.mutate({
      key: `vehicle_${vehicleId}`,
      value: val,
      label: vehicle?.nameKey || vehicleId,
      config_type: 'vehicle',
    });
    setEditingVehicle(prev => { const n = { ...prev }; delete n[vehicleId]; return n; });
  };

  const saveRoute = (routeKey) => {
    const val = parseInt(editingRoute[routeKey]);
    if (isNaN(val) || val <= 0) return;
    const route = allRoutes.find(r => r.key === routeKey);
    saveMutation.mutate({
      key: `route_${routeKey}`,
      value: val,
      label: `${route?.originName} → ${route?.destName}`,
      config_type: 'route',
    });
    setEditingRoute(prev => { const n = { ...prev }; delete n[routeKey]; return n; });
  };

  const resetRoute = async (routeKey) => {
    const existing = configs.find(c => c.key === `route_${routeKey}`);
    if (existing) {
      await base44.entities.PriceConfig.delete(existing.id);
      queryClient.invalidateQueries({ queryKey: ['price-configs'] });
    }
  };

  const precomputeDistances = async () => {
    setPrecomputeStatus({ loading: true });
    try {
      const res = await base44.functions.invoke('precomputeRouteDistances', {});
      setPrecomputeStatus({ loading: false, result: res.data });
    } catch (e) {
      setPrecomputeStatus({ loading: false, error: e.message });
    }
  };

  return (
    <Tabs defaultValue="base">
      <TabsList className="mb-4">
        <TabsTrigger value="base" className="gap-1.5"><Euro className="w-4 h-4" /> Tarifas Base</TabsTrigger>
        <TabsTrigger value="rules" className="gap-1.5"><Zap className="w-4 h-4" /> Regras Dinâmicas</TabsTrigger>
      </TabsList>

      <TabsContent value="rules">
        <PriceRulesManager />
      </TabsContent>

      <TabsContent value="base">
    <div className="space-y-6">
      {/* Vehicle Prices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="w-4 h-4 text-primary" /> {t(lang, 'price_per_km_title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {vehicleTypes.map(v => {
              const current = vehiclePrices[v.id];
              const editing = editingVehicle[v.id];
              const displayVal = editing !== undefined ? editing : (current ?? 0).toFixed(2);
              const isDirty = editing !== undefined && parseFloat(editing) !== current;
              return (
                <div key={v.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm capitalize">{v.id}</p>
                    <Badge variant="outline" className="text-xs">
                      {v.seats} pax · {v.luggage} bags
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">€</span>
                    <Input
                      type="number"
                      step="0.05"
                      min="0.10"
                      value={displayVal}
                      onChange={e => setEditingVehicle(prev => ({ ...prev, [v.id]: e.target.value }))}
                      className="h-9 text-sm"
                    />
                    <span className="text-muted-foreground text-xs whitespace-nowrap">/km</span>
                  </div>
                  {isDirty && (
                   <Button size="sm" className="w-full h-8 gap-1" onClick={() => saveVehicle(v.id)} disabled={saveMutation.isPending}>
                     <Save className="w-3.5 h-3.5" /> {t(lang, 'price_save')}
                   </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Route Distances */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Route className="w-4 h-4 text-primary" /> {t(lang, 'price_route_distances')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={precomputeDistances}
                disabled={precomputeStatus?.loading}
              >
                {precomputeStatus?.loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <DatabaseZap className="w-3.5 h-3.5" />
                )}
                Pré-calcular distâncias
              </Button>
              <Input
                placeholder={t(lang, 'price_search_route')}
                value={routeSearch}
                onChange={e => setRouteSearch(e.target.value)}
                className="h-8 w-52 text-sm"
              />
            </div>
          </div>
          {precomputeStatus && !precomputeStatus.loading && (
            <div className={`text-xs mt-2 ${precomputeStatus.error ? 'text-destructive' : 'text-green-600'}`}>
              {precomputeStatus.error
                ? `Erro: ${precomputeStatus.error}`
                : `Pré-cálculo concluído: ${precomputeStatus.result?.computed || 0} calculadas, ${precomputeStatus.result?.cached || 0} já em cache, ${precomputeStatus.result?.failed || 0} falharam.`}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto divide-y">
            {filteredRoutes.map(route => {
              const editing = editingRoute[route.key];
              const displayVal = editing !== undefined ? editing : route.effectiveDist;
              const isDirty = editing !== undefined && parseInt(editing) !== route.effectiveDist;
              return (
                <div key={route.key} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {route.originName} → {route.destName}
                    </p>
                    {route.isOverridden && (
                      <p className="text-xs text-muted-foreground">{t(lang, 'price_default')}: {route.defaultDist} km</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      min="1"
                      value={displayVal}
                      onChange={e => setEditingRoute(prev => ({ ...prev, [route.key]: e.target.value }))}
                      className="h-8 w-20 text-sm text-center"
                    />
                    <span className="text-xs text-muted-foreground">km</span>
                    {isDirty && (
                      <Button size="sm" className="h-8 px-2 gap-1" onClick={() => saveRoute(route.key)} disabled={saveMutation.isPending}>
                        <Save className="w-3.5 h-3.5" /> {t(lang, 'price_save')}
                      </Button>
                    )}
                    {route.isOverridden && !isDirty && (
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-destructive" onClick={() => resetRoute(route.key)}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
      </TabsContent>
    </Tabs>
  );
}