import { Injectable, signal } from '@angular/core';
import { Style, Fill, Stroke, Circle, RegularShape, Text, Icon } from 'ol/style';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { ArcheoEntityType, StyleConfig, LayerStyle } from '../models/geo-feature.model';

@Injectable({
  providedIn: 'root'
})
export class StyleService {

  // ═══════════════════════════════════════════════════════════════
  // Configuration des styles par défaut
  // ═══════════════════════════════════════════════════════════════

  private readonly defaultStyles: Record<string, LayerStyle> = {
    // Faits archéologiques
    'Fosses': {
      fill: { color: 'rgba(231, 76, 60, 0.4)' },
      stroke: { color: '#c0392b', width: 2 },
      point: { radius: 6, color: '#e74c3c' }
    },
    'Fosses circulaires': {
      fill: { color: 'rgba(142, 68, 173, 0.4)' },
      stroke: { color: '#6c3483', width: 2 },
      point: { radius: 6, color: '#8e44ad' }
    },
    'Trous de poteau': {
      fill: { color: 'rgba(243, 156, 18, 0.5)' },
      stroke: { color: '#d68910', width: 2 },
      point: { radius: 5, color: '#f39c12', shape: 'square' }
    },
    'Murs': {
      fill: { color: 'rgba(149, 165, 166, 0.5)' },
      stroke: { color: '#7f8c8d', width: 3 },
      point: { radius: 6, color: '#95a5a6' }
    },
    'Fossés': {
      fill: { color: 'rgba(52, 152, 219, 0.4)' },
      stroke: { color: '#2980b9', width: 2, lineDash: [10, 5] },
      point: { radius: 6, color: '#3498db' }
    },
    'Structures': {
      fill: { color: 'rgba(26, 188, 156, 0.4)' },
      stroke: { color: '#16a085', width: 2 },
      point: { radius: 6, color: '#1abc9c' }
    },

    // Unités stratigraphiques
    'US': {
      fill: { color: 'rgba(233, 30, 99, 0.35)' },
      stroke: { color: '#c2185b', width: 2 },
      point: { radius: 6, color: '#e91e63' }
    },
    'US positives': {
      fill: { color: 'rgba(76, 175, 80, 0.4)' },
      stroke: { color: '#388e3c', width: 2 },
      point: { radius: 6, color: '#4caf50' }
    },
    'US négatives': {
      fill: { color: 'rgba(244, 67, 54, 0.4)' },
      stroke: { color: '#d32f2f', width: 2 },
      point: { radius: 6, color: '#f44336' }
    },

    // Secteurs
    'Secteurs': {
      fill: { color: 'rgba(46, 204, 113, 0.25)' },
      stroke: { color: '#27ae60', width: 3, lineDash: [15, 10] },
      point: { radius: 8, color: '#2ecc71' }
    },

    // Points topographiques
    'Points Topo': {
      fill: { color: 'rgba(26, 188, 156, 0.8)' },
      stroke: { color: '#16a085', width: 2 },
      point: { radius: 4, color: '#1abc9c', shape: 'triangle' }
    },

    // Prélèvements
    'Prélèvements': {
      fill: { color: 'rgba(255, 87, 34, 0.5)' },
      stroke: { color: '#e64a19', width: 2 },
      point: { radius: 6, color: '#ff5722', shape: 'diamond' }
    },

    // Mobilier
    'Mobilier': {
      fill: { color: 'rgba(121, 85, 72, 0.5)' },
      stroke: { color: '#5d4037', width: 2 },
      point: { radius: 5, color: '#795548', shape: 'star' }
    },

    // Photos
    'Photos': {
      fill: { color: 'rgba(0, 188, 212, 0.4)' },
      stroke: { color: '#0097a7', width: 2 },
      point: { radius: 6, color: '#00bcd4' }
    },

    // Autres types
    'Tranchée': {
      fill: { color: 'rgba(63, 81, 181, 0.3)' },
      stroke: { color: '#303f9f', width: 2, lineDash: [5, 5] },
      point: { radius: 6, color: '#3f51b5' }
    },
    'Canalisation': {
      fill: { color: 'rgba(96, 125, 139, 0.4)' },
      stroke: { color: '#455a64', width: 2 },
      point: { radius: 6, color: '#607d8b' }
    },

    // Style par défaut
    'default': {
      fill: { color: 'rgba(66, 66, 66, 0.4)' },
      stroke: { color: '#424242', width: 2 },
      point: { radius: 6, color: '#424242' }
    }
  };

  // Styles personnalisés (modifiables par l'utilisateur)
  private customStyles = signal<Record<string, LayerStyle>>({});

  // ═══════════════════════════════════════════════════════════════
  // Getters
  // ═══════════════════════════════════════════════════════════════

  /**
   * Récupère le style pour un type donné
   */
  getStyleConfig(gmlType: string): LayerStyle {
    const custom = this.customStyles()[gmlType];
    if (custom) return custom;
    return this.defaultStyles[gmlType] || this.defaultStyles['default'];
  }

  /**
   * Récupère tous les styles disponibles
   */
  getAllStyles(): Record<string, LayerStyle> {
    return { ...this.defaultStyles, ...this.customStyles() };
  }

  /**
   * Récupère la couleur principale d'un type
   */
  getColor(gmlType: string): string {
    const style = this.getStyleConfig(gmlType);
    return style.stroke?.color || style.point?.color || '#424242';
  }

  // ═══════════════════════════════════════════════════════════════
  // Création de styles OpenLayers
  // ═══════════════════════════════════════════════════════════════

  /**
   * Crée une fonction de style OpenLayers pour un type
   */
  createStyleFunction(gmlType: string): (feature: Feature<Geometry>, resolution: number) => Style | Style[] {
    const config = this.getStyleConfig(gmlType);

    return (feature: Feature<Geometry>, resolution: number) => {
      const geometryType = feature.getGeometry()?.getType();
      const isSelected = feature.get('selected') === true;
      const isHighlighted = feature.get('highlighted') === true;

      if (isSelected) {
        return this.createSelectedStyle(geometryType);
      }

      if (isHighlighted) {
        return this.createHighlightedStyle(geometryType, config);
      }

      return this.createNormalStyle(geometryType, config, feature, resolution);
    };
  }

  /**
   * Crée un style normal
   */
  private createNormalStyle(
    geometryType: string | undefined,
    config: LayerStyle,
    feature: Feature<Geometry>,
    resolution: number
  ): Style {
    const styles: Style[] = [];

    if (geometryType === 'Point') {
      return this.createPointStyle(config);
    }

    // Style de base pour polygones et lignes
    const baseStyle = new Style({
      fill: config.fill ? new Fill({ color: config.fill.color }) : undefined,
      stroke: config.stroke ? new Stroke({
        color: config.stroke.color,
        width: config.stroke.width || 2,
        lineDash: config.stroke.lineDash
      }) : undefined
    });

    // Ajouter label si zoom suffisant
    if (resolution < 2 && feature.get('faitLabel')) {
      return new Style({
        fill: baseStyle.getFill() || undefined,
        stroke: baseStyle.getStroke() || undefined,
        text: this.createTextStyle(feature.get('faitLabel'))
      });
    }

    return baseStyle;
  }

  /**
   * Crée un style pour les points
   */
  private createPointStyle(config: LayerStyle): Style {
    const pointConfig = config.point || { radius: 6, color: '#424242' };

    let image;

    switch (pointConfig.shape) {
      case 'square':
        image = new RegularShape({
          fill: new Fill({ color: pointConfig.color }),
          stroke: new Stroke({ color: this.darkenColor(pointConfig.color, 20), width: 2 }),
          points: 4,
          radius: pointConfig.radius,
          angle: Math.PI / 4
        });
        break;

      case 'triangle':
        image = new RegularShape({
          fill: new Fill({ color: pointConfig.color }),
          stroke: new Stroke({ color: this.darkenColor(pointConfig.color, 20), width: 2 }),
          points: 3,
          radius: pointConfig.radius,
          angle: 0
        });
        break;

      case 'diamond':
        image = new RegularShape({
          fill: new Fill({ color: pointConfig.color }),
          stroke: new Stroke({ color: this.darkenColor(pointConfig.color, 20), width: 2 }),
          points: 4,
          radius: pointConfig.radius,
          angle: 0
        });
        break;

      case 'star':
        image = new RegularShape({
          fill: new Fill({ color: pointConfig.color }),
          stroke: new Stroke({ color: this.darkenColor(pointConfig.color, 20), width: 1 }),
          points: 5,
          radius: pointConfig.radius,
          radius2: pointConfig.radius / 2,
          angle: 0
        });
        break;

      default: // circle
        image = new Circle({
          radius: pointConfig.radius,
          fill: new Fill({ color: pointConfig.color }),
          stroke: new Stroke({ color: this.darkenColor(pointConfig.color, 20), width: 2 })
        });
    }

    return new Style({ image });
  }

  /**
   * Crée un style de sélection
   */
  private createSelectedStyle(geometryType: string | undefined): Style {
    if (geometryType === 'Point') {
      return new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: 'rgba(255, 235, 59, 0.8)' }),
          stroke: new Stroke({ color: '#ffc107', width: 3 })
        })
      });
    }

    return new Style({
      fill: new Fill({ color: 'rgba(255, 235, 59, 0.5)' }),
      stroke: new Stroke({ color: '#ffc107', width: 4 })
    });
  }

  /**
   * Crée un style de survol
   */
  private createHighlightedStyle(geometryType: string | undefined, config: LayerStyle): Style {
    if (geometryType === 'Point') {
      return new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: 'rgba(100, 181, 246, 0.8)' }),
          stroke: new Stroke({ color: '#2196f3', width: 2 })
        })
      });
    }

    return new Style({
      fill: new Fill({ color: 'rgba(100, 181, 246, 0.3)' }),
      stroke: new Stroke({
        color: '#2196f3',
        width: (config.stroke?.width || 2) + 1
      })
    });
  }

  /**
   * Crée un style de texte
   */
  private createTextStyle(text: string): Text {
    return new Text({
      text: text,
      font: '12px sans-serif',
      fill: new Fill({ color: '#333' }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
      offsetY: -15,
      textAlign: 'center'
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Personnalisation des styles
  // ═══════════════════════════════════════════════════════════════

  /**
   * Définit un style personnalisé pour un type
   */
  setCustomStyle(gmlType: string, style: Partial<LayerStyle>): void {
    const current = this.getStyleConfig(gmlType);
    const merged: LayerStyle = {
      fill: { ...current.fill, ...style.fill },
      stroke: { ...current.stroke, ...style.stroke },
      point: { ...current.point, ...style.point }
    };

    this.customStyles.update(styles => ({
      ...styles,
      [gmlType]: merged
    }));
  }

  /**
   * Réinitialise le style d'un type
   */
  resetStyle(gmlType: string): void {
    this.customStyles.update(styles => {
      const { [gmlType]: _, ...rest } = styles;
      return rest;
    });
  }

  /**
   * Réinitialise tous les styles personnalisés
   */
  resetAllStyles(): void {
    this.customStyles.set({});
  }

  // ═══════════════════════════════════════════════════════════════
  // Utilitaires
  // ═══════════════════════════════════════════════════════════════

  private darkenColor(hex: string, percent: number): string {
    // Gérer le format rgba
    if (hex.startsWith('rgba')) {
      const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = Math.max(parseInt(match[1]) - Math.round(2.55 * percent), 0);
        const g = Math.max(parseInt(match[2]) - Math.round(2.55 * percent), 0);
        const b = Math.max(parseInt(match[3]) - Math.round(2.55 * percent), 0);
        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    // Format hex
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }
}