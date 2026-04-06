import serviceLocator from "../core/ServiceLocator.js";
import { GAME_CONST } from "../constants.js";

class RenderSystem {
  drawByTag(ctx, camera, entityManager, tag) {
    const entities = entityManager.getByTag(tag);
    this.drawEntities(ctx, camera, entities);
  }

  updateAnimations(entities, deltaTime) {
    for (const entity of entities) {
      const sprite = entity.getComponent("sprite");
      if (!sprite || sprite.numFrames <= 1) continue;

      sprite.animationTimer += deltaTime;
      if (sprite.animationTimer >= sprite.animationSpeed) {
        sprite.animationTimer = 0;
        sprite.currentFrame++;
        if (sprite.currentFrame >= sprite.numFrames) {
          if (sprite.loop) {
            sprite.currentFrame = 0;
          } else {
            sprite.currentFrame = sprite.numFrames - 1;
          }
        }
      }
    }
  }

  drawEntities(ctx, camera, entities) {
    const assets = serviceLocator.get("assets");

    for (const entity of entities) {
      const transform = entity.getComponent("transform");
      const sprite = entity.getComponent("sprite");
      if (!transform || !sprite || sprite.visible === false) continue;
      const projectile = entity.getComponent("projectile");

      const posX = transform.position.x - camera.x;
      const posY = transform.position.y - camera.y;

      if (projectile) {
        this.drawProjectile(ctx, transform, sprite.color, camera);
        continue;
      }

      const shouldDrawSprite =
        !GAME_CONST.debug.hitboxOnly &&
        sprite.type === "sprite" &&
        sprite.assetKey &&
        assets;

      if (shouldDrawSprite) {
        const image = assets.getImage(sprite.assetKey);
        if (image) {
          ctx.save();
          
          let drawX = posX;
          let drawY = posY;
          let drawW = sprite.frameWidth * sprite.scale;
          let drawH = sprite.frameHeight * sprite.scale;

          if (sprite.assetKey && (sprite.assetKey.includes("pickup-5x") || sprite.assetKey.includes("pickup-10x") || sprite.assetKey.includes("pickup-20x"))) {
             // For single images, use the pre-calculated frameWidth/height and scale
             drawW = sprite.frameWidth * sprite.scale;
             drawH = sprite.frameHeight * sprite.scale;
             drawX = posX - (drawW - transform.width) / 2;
             
             // --- EDIT THIS TO MOVE AMMO UP OR DOWN ---
             // Negative numbers move it UP (e.g., -10)
             // Positive numbers move it DOWN (e.g., 5)
             const pickupYOffset = 30; 
             
             // Bottom align so it touches the platform, plus the offset
             drawY = posY - (drawH - transform.height) + pickupYOffset;
             
             if (sprite.flipX || (!sprite.noFlip && transform.facing === -1)) {
               ctx.scale(-1, 1);
               ctx.drawImage(image, 0, 0, image.naturalWidth || image.width, image.naturalHeight || image.height, -drawX - drawW, drawY, drawW, drawH);
             } else {
               ctx.drawImage(image, 0, 0, image.naturalWidth || image.width, image.naturalHeight || image.height, drawX, drawY, drawW, drawH);
             }
          } else {
            const frameIndex = Array.isArray(sprite.frameSequence) &&
              sprite.frameSequence.length > 0
              ? sprite.frameSequence[sprite.currentFrame] ?? sprite.frameSequence[0]
              : sprite.frameX + sprite.currentFrame;
            const frameX = frameIndex * sprite.frameWidth;
            const frameY = sprite.frameY * sprite.frameHeight;

            // Simple centering if frame size differs from transform size
            drawX -= (drawW - transform.width) / 2;
            drawY -= (drawH - transform.height); // Bottom align
            drawY += sprite.offsetY || 0;

            if (sprite.flipX || (!sprite.noFlip && transform.facing === -1)) {
              ctx.scale(-1, 1);
              ctx.drawImage(
                image,
                frameX, frameY, sprite.frameWidth, sprite.frameHeight,
                -drawX - drawW, drawY, drawW, drawH
              );
            } else {
              ctx.drawImage(
                image,
                frameX, frameY, sprite.frameWidth, sprite.frameHeight,
                drawX, drawY, drawW, drawH
              );
            }
          }
          ctx.restore();
        } else {
          this.drawFallback(ctx, posX, posY, transform.width, transform.height, sprite.color);
        }
      } else {
        this.drawFallback(ctx, posX, posY, transform.width, transform.height, sprite.color);
      }

      if (sprite.gunColor) {
        this.drawGun(ctx, posX, posY, transform.width, transform.height, transform.facing || 1, sprite);
      }

      const playerState = entity.getComponent("playerState");
      if (playerState) {
        this.drawPlayerIndicator(ctx, posX, posY, transform.width);
      }

      // Fuel Indicator above player's head
      if (playerState && playerState.jetpackFuel !== undefined) {
        const baseBarWidth = 40;
        const barHeight = 4;
        const maxFuel = Math.max(100, playerState.maxJetpackFuel || 100);
        const barWidth = baseBarWidth * (maxFuel / 100);
        const barX = posX + (transform.width - barWidth) / 2;
        const barY = posY - 20;
        const fuelRatio = Math.max(0, Math.min(1, playerState.jetpackFuel / maxFuel));

        // Background (gray)
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Foreground (colored based on fuel level)
        if (fuelRatio > 0.5) ctx.fillStyle = "#00ff88"; // Green
        else if (fuelRatio > 0.25) ctx.fillStyle = "#ffcc00"; // Orange/Yellow
        else ctx.fillStyle = "#ff4444"; // Red

        ctx.fillRect(barX, barY, barWidth * fuelRatio, barHeight);
        
        // Border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
      }
    }
  }

  drawPlayerIndicator(ctx, x, y, width) {
    const indicator = GAME_CONST.player.indicator || {};
    const size = indicator.size || 12;
    const offsetY = indicator.offsetY || 28;
    const tipX = x + width * 0.5;
    const tipY = y - offsetY;
    const baseY = tipY - size;
    const halfWidth = size * 0.65;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - halfWidth, baseY);
    ctx.lineTo(tipX + halfWidth, baseY);
    ctx.closePath();
    ctx.fillStyle = indicator.color || "#ffe066";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = indicator.outlineColor || "#2b1e08";
    ctx.stroke();
  }

  drawFallback(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  drawProjectile(ctx, transform, color, camera) {
    const x = transform.position.x - camera.x;
    const y = transform.position.y - camera.y;
    const w = transform.width;
    const h = transform.height;
    const trailLength = GAME_CONST.effects.projectiles.trailLength;
    const trailWidth = GAME_CONST.effects.projectiles.trailWidth;
    const glowAlpha = GAME_CONST.effects.projectiles.glowAlpha;
    const velocity = transform.velocity || { x: 0, y: 0 };
    const speed = Math.hypot(velocity.x, velocity.y) || 1;
    const dirX = velocity.x / speed;
    const dirY = velocity.y / speed;
    const centerX = x + w * 0.5;
    const centerY = y + h * 0.5;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = glowAlpha;
    ctx.lineWidth = trailWidth;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - dirX * trailLength, centerY - dirY * trailLength);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(w, h) * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  drawGun(ctx, x, y, w, h, dir, sprite) {
    ctx.fillStyle = sprite.gunColor;
    const gunWidth = sprite.gunWidth || 14;
    const gunHeight = sprite.gunHeight || 4;
    const gunOffsetY = sprite.gunOffsetY || 18;
    const gunInsetRight = sprite.gunInsetRight || 10;
    const gunInsetLeft = sprite.gunInsetLeft || 4;

    if (dir > 0) {
      ctx.fillRect(x + w - gunInsetRight, y + gunOffsetY, gunWidth, gunHeight);
    } else {
      ctx.fillRect(x - gunInsetLeft, y + gunOffsetY, gunWidth, gunHeight);
    }
  }
}

export default RenderSystem;
