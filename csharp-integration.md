# C# Backend Integration Guide

## ASP.NET Core Integration

### 1. Simple Form Submission

**HTML (Razor View)**
```html
@{
    ViewData["Title"] = "Rich Text Editor";
}

<form asp-action="SaveContent" method="post">
    <div class="form-group">
        <label asp-for="Title">Title</label>
        <input asp-for="Title" class="form-control" />
    </div>
    
    <div class="form-group">
        <label asp-for="Content">Content</label>
        <div id="content-editor"></div>
        <input asp-for="Content" type="hidden" id="hidden-content" />
    </div>
    
    <button type="submit" class="btn btn-primary">Save</button>
</form>

<script src="~/js/rich-text-editor.js"></script>
<script>
    const editor = new RichTextEditor('content-editor');
    
    document.querySelector('form').addEventListener('submit', function() {
        document.getElementById('hidden-content').value = editor.getContent();
    });
</script>
```

**C# Model**
```csharp
public class ContentModel
{
    public string Title { get; set; }
    public string Content { get; set; }
}
```

**C# Controller**
```csharp
[HttpPost]
public async Task<IActionResult> SaveContent(ContentModel model)
{
    if (ModelState.IsValid)
    {
        // Save to database
        var content = new Content
        {
            Title = model.Title,
            HtmlContent = model.Content,
            PlainText = StripHtml(model.Content),
            CreatedAt = DateTime.UtcNow
        };
        
        _context.Contents.Add(content);
        await _context.SaveChangesAsync();
        
        return RedirectToAction("Index");
    }
    
    return View(model);
}

private string StripHtml(string html)
{
    return Regex.Replace(html, "<.*?>", string.Empty);
}
```

### 2. AJAX API Integration

**JavaScript**
```javascript
// Initialize editor
const editor = new RichTextEditor('content-editor');

// Save function
async function saveContent() {
    const data = {
        title: document.getElementById('title').value,
        content: editor.getContent()
    };
    
    try {
        const response = await fetch('/api/content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            alert('Content saved successfully!');
        } else {
            alert('Error saving content');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error');
    }
}
```

**C# API Controller**
```csharp
[ApiController]
[Route("api/[controller]")]
public class ContentController : ControllerBase
{
    private readonly IContentService _contentService;
    
    public ContentController(IContentService contentService)
    {
        _contentService = contentService;
    }
    
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveContent([FromBody] ContentDto dto)
    {
        try
        {
            var contentId = await _contentService.SaveContentAsync(dto);
            return Ok(new { Id = contentId, Message = "Content saved successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetContent(int id)
    {
        var content = await _contentService.GetContentAsync(id);
        if (content == null)
            return NotFound();
            
        return Ok(content);
    }
}
```

### 3. Entity Framework Model

```csharp
public class Content
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string HtmlContent { get; set; }
    public string PlainText { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int AuthorId { get; set; }
    public virtual User Author { get; set; }
}

public class ApplicationDbContext : DbContext
{
    public DbSet<Content> Contents { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Content>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.HtmlContent).HasColumnType("ntext");
            entity.Property(e => e.PlainText).HasColumnType("ntext");
        });
    }
}
```

### 4. Service Layer

```csharp
public interface IContentService
{
    Task<int> SaveContentAsync(ContentDto dto);
    Task<ContentDto> GetContentAsync(int id);
    Task<bool> UpdateContentAsync(int id, ContentDto dto);
    Task<bool> DeleteContentAsync(int id);
}

public class ContentService : IContentService
{
    private readonly ApplicationDbContext _context;
    private readonly IHtmlSanitizer _htmlSanitizer;
    
    public ContentService(ApplicationDbContext context, IHtmlSanitizer htmlSanitizer)
    {
        _context = context;
        _htmlSanitizer = htmlSanitizer;
    }
    
    public async Task<int> SaveContentAsync(ContentDto dto)
    {
        // Sanitize HTML content
        var sanitizedHtml = _htmlSanitizer.Sanitize(dto.Content);
        
        var content = new Content
        {
            Title = dto.Title,
            HtmlContent = sanitizedHtml,
            PlainText = StripHtml(sanitizedHtml),
            CreatedAt = DateTime.UtcNow,
            AuthorId = dto.AuthorId
        };
        
        _context.Contents.Add(content);
        await _context.SaveChangesAsync();
        
        return content.Id;
    }
    
    public async Task<ContentDto> GetContentAsync(int id)
    {
        var content = await _context.Contents.FindAsync(id);
        if (content == null) return null;
        
        return new ContentDto
        {
            Id = content.Id,
            Title = content.Title,
            Content = content.HtmlContent,
            CreatedAt = content.CreatedAt
        };
    }
    
    private string StripHtml(string html)
    {
        return Regex.Replace(html, "<.*?>", string.Empty);
    }
}
```

### 5. HTML Sanitization (Security)

**Install HtmlSanitizer NuGet Package**
```xml
<PackageReference Include="HtmlSanitizer" Version="8.0.723" />
```

**Configure in Startup.cs / Program.cs**
```csharp
// Program.cs (.NET 6+)
builder.Services.AddScoped<IHtmlSanitizer>(provider =>
{
    var sanitizer = new HtmlSanitizer();
    
    // Allow common formatting tags
    sanitizer.AllowedTags.Add("p");
    sanitizer.AllowedTags.Add("br");
    sanitizer.AllowedTags.Add("strong");
    sanitizer.AllowedTags.Add("em");
    sanitizer.AllowedTags.Add("u");
    sanitizer.AllowedTags.Add("h1");
    sanitizer.AllowedTags.Add("h2");
    sanitizer.AllowedTags.Add("h3");
    sanitizer.AllowedTags.Add("ul");
    sanitizer.AllowedTags.Add("ol");
    sanitizer.AllowedTags.Add("li");
    sanitizer.AllowedTags.Add("a");
    sanitizer.AllowedTags.Add("img");
    sanitizer.AllowedTags.Add("table");
    sanitizer.AllowedTags.Add("tr");
    sanitizer.AllowedTags.Add("td");
    sanitizer.AllowedTags.Add("th");
    
    // Allow specific attributes
    sanitizer.AllowedAttributes.Add("href");
    sanitizer.AllowedAttributes.Add("src");
    sanitizer.AllowedAttributes.Add("alt");
    sanitizer.AllowedAttributes.Add("title");
    sanitizer.AllowedAttributes.Add("style");
    
    return sanitizer;
});
```

## Quick Integration Examples

### One-Line Integration
```html
<!-- Just add these two lines to any page -->
<div data-rich-editor data-height="400px"></div>
<script src="~/js/rich-text-editor.js"></script>
```

### Form Integration
```html
<form asp-action="Save" method="post">
    <div id="editor"></div>
    <input asp-for="Content" type="hidden" id="content-field" />
    <button type="submit">Save</button>
</form>

<script src="~/js/rich-text-editor.js"></script>
<script>
    const editor = new RichTextEditor('editor');
    document.querySelector('form').onsubmit = () => {
        document.getElementById('content-field').value = editor.getContent();
    };
</script>
```

### AJAX Integration
```javascript
const editor = new RichTextEditor('editor');

async function save() {
    const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editor.getContent() })
    });
    
    if (response.ok) alert('Saved!');
}
```

## Key Points for C# Integration

1. **Always sanitize HTML** content before saving to database
2. **Use hidden fields** for form submissions
3. **Validate content** on the server side
4. **Store both HTML and plain text** versions
5. **Handle CSRF tokens** for AJAX requests
6. **Use proper DTOs** for API endpoints
7. **Implement proper error handling** and validation


Copyright @2025 by Rajesh C