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
      if (!transform || !sprite) continue;

      const posX = transform.position.x - camera.x;
      const posY = transform.position.y - camera.y;

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
            const frameX = (sprite.frameX + sprite.currentFrame) * sprite.frameWidth;
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

      // Fuel Indicator above player's head
      const playerState = entity.getComponent("playerState");
      if (playerState && playerState.jetpackFuel !== undefined) {
        const barWidth = 40;
        const barHeight = 4;
        const barX = posX + (transform.width - barWidth) / 2;
        const barY = posY - 20;
        const fuelRatio = playerState.jetpackFuel / 100;

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

  drawFallback(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
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
